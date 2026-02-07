import express from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// List scheduled rides for the authenticated passenger
router.get("/", requireAuth, requireRole("passenger"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, user_id, pickup_address, dropoff_address,
              pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
              vehicle_type, scheduled_at, status, created_at
       FROM scheduled_rides
       WHERE user_id = $1
       ORDER BY scheduled_at ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch scheduled rides" });
  }
});

// Create a new scheduled ride (passenger)
router.post("/", requireAuth, requireRole("passenger"), async (req, res) => {
  try {
    const {
      pickup_address,
      dropoff_address,
      pickup_lat,
      pickup_lng,
      dropoff_lat,
      dropoff_lng,
      vehicle_type,
      scheduled_at,
    } = req.body;

    if (!pickup_address || !dropoff_address || !vehicle_type || !scheduled_at) {
      return res.status(400).json({
        error: "pickup_address, dropoff_address, vehicle_type and scheduled_at are required",
      });
    }

    const { rows } = await query(
      `INSERT INTO scheduled_rides (
         user_id, pickup_address, pickup_lat, pickup_lng,
         dropoff_address, dropoff_lat, dropoff_lng,
         vehicle_type, scheduled_at, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
       RETURNING id, user_id, pickup_address, dropoff_address,
                 pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
                 vehicle_type, scheduled_at, status, created_at`,
      [
        req.userId,
        pickup_address,
        pickup_lat ?? null,
        pickup_lng ?? null,
        dropoff_address,
        dropoff_lat ?? null,
        dropoff_lng ?? null,
        vehicle_type,
        scheduled_at,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to schedule ride" });
  }
});

// Convert a scheduled ride into a live ride request (start now)
router.post("/:id/start-ride", requireAuth, requireRole("passenger"), async (req, res) => {
  try {
    const { id } = req.params;
    const { fare_amount, payment_method_id: bodyPaymentMethodId } = req.body;

    const { rows: scheduledRows } = await query(
      `SELECT id, user_id, pickup_address, pickup_lat, pickup_lng,
              dropoff_address, dropoff_lat, dropoff_lng, vehicle_type, scheduled_at
       FROM scheduled_rides
       WHERE id = $1 AND user_id = $2 AND status = 'scheduled'`,
      [id, req.userId]
    );
    if (!scheduledRows[0]) {
      return res.status(404).json({ error: "Scheduled ride not found or already used/cancelled" });
    }
    const scheduled = scheduledRows[0];

    let paymentMethodId = bodyPaymentMethodId;
    if (!paymentMethodId) {
      const { rows: pmRows } = await query(
        "SELECT id FROM payment_methods WHERE user_id = $1 AND is_default = true LIMIT 1",
        [req.userId]
      );
      if (!pmRows[0]) {
        return res.status(400).json({ error: "No default payment method. Set one in payment methods or pass payment_method_id." });
      }
      paymentMethodId = pmRows[0].id;
    }

    if (fare_amount == null || Number(fare_amount) <= 0) {
      return res.status(400).json({ error: "fare_amount is required and must be positive" });
    }

    const { rows: createRows } = await query(
      `SELECT create_ride_request($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) AS result`,
      [
        req.userId,
        scheduled.pickup_address,
        scheduled.dropoff_address,
        scheduled.vehicle_type,
        paymentMethodId,
        Number(fare_amount),
        scheduled.pickup_lat ?? null,
        scheduled.pickup_lng ?? null,
        scheduled.dropoff_lat ?? null,
        scheduled.dropoff_lng ?? null,
        "RWF",
        null,
        null,
        false,
      ]
    );
    const rawResult = createRows[0]?.result;
    if (rawResult == null) {
      return res.status(500).json({ error: "Ride creation failed" });
    }
    const result = typeof rawResult === "string" ? JSON.parse(rawResult) : rawResult;

    await query(
      "UPDATE scheduled_rides SET status = 'completed' WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to start ride" });
  }
});

// Cancel a scheduled ride
router.patch("/:id/cancel", requireAuth, requireRole("passenger"), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE scheduled_rides
       SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status = 'scheduled'
       RETURNING id, user_id, pickup_address, dropoff_address,
                 pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
                 vehicle_type, scheduled_at, status, created_at`,
      [id, req.userId]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Scheduled ride not found or cannot be cancelled" });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to cancel scheduled ride" });
  }
});

export default router;

