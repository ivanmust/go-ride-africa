import express from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();
const FLW_SECRET = process.env.FLW_SECRET_KEY;
const FLW_BASE = "https://api.flutterwave.com/v3";
const FRONTEND_URL = (process.env.FRONTEND_URL || "").replace(/\/$/, "");

function hasFlutterwaveConfig() {
  return !!FLW_SECRET;
}

// Get payment status for a ride (so frontend can show Pay vs Paid)
router.get("/status", requireAuth, async (req, res) => {
  const rideHistoryId = req.query.ride_history_id;
  if (!rideHistoryId) return res.status(400).json({ error: "ride_history_id required" });
  const { rows } = await query(
    "SELECT status FROM ride_payments WHERE ride_history_id = $1 AND user_id = $2",
    [rideHistoryId, req.userId]
  );
  const paid = rows[0]?.status === "completed";
  return res.json({ paid, status: rows[0]?.status || null });
});

// Initialize Flutterwave payment for a completed ride (passenger pays)
router.post("/initialize", requireAuth, requireRole("passenger"), async (req, res) => {
  if (!hasFlutterwaveConfig()) {
    return res.status(503).json({ error: "Flutterwave is not configured. Add FLW_SECRET_KEY and FLW_PUBLIC_KEY to backend/.env" });
  }
  try {
    const { ride_history_id } = req.body;
    if (!ride_history_id) return res.status(400).json({ error: "ride_history_id required" });

    const { rows: rideRows } = await query(
      `SELECT id, user_id, driver_id, fare_amount, currency FROM ride_history
       WHERE id = $1 AND user_id = $2 AND status = 'completed'`,
      [ride_history_id, req.userId]
    );
    if (!rideRows[0]) {
      return res.status(404).json({ error: "Ride not found or not completed" });
    }
    const ride = rideRows[0];
    const amount = Number(ride.fare_amount);
    const currency = ride.currency || "RWF";
    if (!(amount > 0)) return res.status(400).json({ error: "Invalid fare amount" });

    const { rows: existing } = await query(
      "SELECT id, status FROM ride_payments WHERE ride_history_id = $1",
      [ride_history_id]
    );
    if (existing[0]) {
      if (existing[0].status === "completed") {
        return res.status(400).json({ error: "This ride is already paid" });
      }
      if (existing[0].status === "pending") {
        const { rows: linkRow } = await query(
          "SELECT flw_tx_ref FROM ride_payments WHERE ride_history_id = $1",
          [ride_history_id]
        );
        const txRef = linkRow[0].flw_tx_ref;
        const paymentUrl = await getOrCreatePaymentLink(ride_history_id, req.userId, amount, currency, txRef, req);
        if (paymentUrl) {
          return res.json({ payment_url: paymentUrl, tx_ref: txRef });
        }
      }
    }

    const txRef = `goride-${ride_history_id}-${Date.now()}`;
    const { rows: profileRows } = await query(
      "SELECT email, full_name, phone FROM profiles WHERE id = $1",
      [req.userId]
    );
    const profile = profileRows[0] || {};
    const customer = {
      email: profile.email || `user-${req.userId}@goride.local`,
      name: profile.full_name || "Passenger",
      phonenumber: profile.phone || "",
    };

    const initRes = await fetch(`${FLW_BASE}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FLW_SECRET}`,
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: Math.round(amount),
        currency,
        redirect_url: `${FRONTEND_URL}/ride?payment=callback&tx_id={{tx_id}}&tx_ref=${encodeURIComponent(txRef)}`,
        customer,
        meta: { ride_history_id, user_id: req.userId },
      }),
    });

    const data = await initRes.json();
    if (data.status !== "success" || !data.data?.link) {
      console.error("Flutterwave init error:", data);
      return res.status(502).json({ error: data.message || "Failed to create payment link" });
    }

    await query(
      `INSERT INTO ride_payments (ride_history_id, user_id, amount, currency, flw_tx_ref, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (ride_history_id) DO UPDATE SET flw_tx_ref = $5, status = 'pending', updated_at = now()`,
      [ride_history_id, req.userId, amount, currency, txRef]
    );

    res.json({ payment_url: data.data.link, tx_ref: txRef });
  } catch (e) {
    console.error("Payment initialize error:", e);
    res.status(500).json({ error: e.message || "Failed to initialize payment" });
  }
});

async function getOrCreatePaymentLink(rideHistoryId, userId, amount, currency, txRef, req) {
  const { rows: profileRows } = await query(
    "SELECT email, full_name, phone FROM profiles WHERE id = $1",
    [userId]
  );
  const profile = profileRows[0] || {};
  const customer = {
    email: profile.email || `user-${userId}@goride.local`,
    name: profile.full_name || "Passenger",
    phonenumber: profile.phone || "",
  };
  const initRes = await fetch(`${FLW_BASE}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLW_SECRET}`,
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount: Math.round(amount),
      currency,
      redirect_url: `${FRONTEND_URL}/ride?payment=callback&tx_id={{tx_id}}&tx_ref=${encodeURIComponent(txRef)}`,
      customer,
      meta: { ride_history_id: rideHistoryId, user_id: userId },
    }),
  });
  const data = await initRes.json();
  return data.status === "success" && data.data?.link ? data.data.link : null;
}

// Verify transaction after redirect (passenger or frontend calls with tx_id from redirect)
router.get("/verify", requireAuth, async (req, res) => {
  if (!hasFlutterwaveConfig()) {
    return res.status(503).json({ error: "Flutterwave is not configured" });
  }
  try {
    const txId = req.query.tx_id;
    if (!txId) return res.status(400).json({ error: "tx_id required" });

    const verifyRes = await fetch(`${FLW_BASE}/transactions/${txId}/verify`, {
      headers: { Authorization: `Bearer ${FLW_SECRET}` },
    });
    const data = await verifyRes.json();
    if (data.status !== "success" || !data.data) {
      return res.status(400).json({ error: data.message || "Transaction not found or failed" });
    }
    const tx = data.data;
    const txRef = tx.tx_ref;
    const paid = tx.status === "successful" && Number(tx.amount) >= 0;

    const { rows: payRows } = await query(
      "SELECT id, ride_history_id, user_id, status FROM ride_payments WHERE flw_tx_ref = $1",
      [txRef]
    );
    if (!payRows[0]) {
      return res.status(404).json({ error: "Payment record not found" });
    }
    if (payRows[0].user_id !== req.userId) {
      return res.status(403).json({ error: "Not your payment" });
    }
    if (payRows[0].status === "completed") {
      return res.json({ status: "completed", message: "Already paid", ride_history_id: payRows[0].ride_history_id });
    }

    if (paid) {
      await query(
        "UPDATE ride_payments SET flw_tx_id = $1, status = 'completed', updated_at = now() WHERE flw_tx_ref = $2",
        [tx.id, txRef]
      );
      return res.json({ status: "completed", message: "Payment successful", ride_history_id: payRows[0].ride_history_id });
    }

    await query(
      "UPDATE ride_payments SET flw_tx_id = $1, status = 'failed', updated_at = now() WHERE flw_tx_ref = $2",
      [tx.id, txRef]
    );
    return res.json({ status: "failed", message: "Payment was not successful" });
  } catch (e) {
    console.error("Payment verify error:", e);
    res.status(500).json({ error: e.message || "Verification failed" });
  }
});

// Webhook from Flutterwave (no auth; verify with FLW_WEBHOOK_SECRET if set)
router.post("/webhook", async (req, res) => {
  if (!hasFlutterwaveConfig()) return res.status(503).send();
  const secret = process.env.FLW_WEBHOOK_SECRET;
  if (secret && req.headers["verif-hash"] !== secret) {
    return res.status(401).send("Invalid signature");
  }
  const body = req.body || {};
  const event = body.event;
  const payload = body.data || {};
  if (event === "charge.completed" && payload.tx_ref) {
    try {
      await query(
        `UPDATE ride_payments SET flw_tx_id = $1, status = 'completed', updated_at = now()
         WHERE flw_tx_ref = $2 AND status = 'pending'`,
        [payload.id || null, payload.tx_ref]
      );
    } catch (e) {
      console.error("Webhook update error:", e);
    }
  }
  res.status(200).send("OK");
});

export default router;
