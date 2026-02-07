import express from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM driver_earnings WHERE driver_id = $1 ORDER BY date DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch earnings" });
  }
});

router.get("/payouts", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM driver_payouts WHERE driver_id = $1 ORDER BY requested_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch payouts" });
  }
});

router.post("/payouts", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const { amount, payout_method, mobile_money_provider, mobile_money_number } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "amount required" });
    const { rows } = await query(
      `INSERT INTO driver_payouts (driver_id, amount, payout_method, mobile_money_provider, mobile_money_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, amount, payout_method || "mobile_money", mobile_money_provider || null, mobile_money_number || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to request payout" });
  }
});

export default router;
