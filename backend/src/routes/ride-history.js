import express from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, user_id, driver_id, driver_name, driver_photo, vehicle_type, vehicle_plate,
              pickup_address, dropoff_address, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
              fare_amount, currency, distance_km, duration_minutes, status, started_at, completed_at, created_at
       FROM ride_history
       WHERE user_id = $1 OR driver_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch ride history" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM ride_history WHERE id = $1 AND (user_id = $2 OR driver_id = $2)`,
      [req.params.id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: "Ride not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch ride" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { status, completed_at, user_rating, user_feedback } = req.body;
    const updates = [];
    const values = [];
    let i = 1;
    if (status !== undefined) { updates.push(`status = $${i++}`); values.push(status); }
    if (completed_at !== undefined) { updates.push(`completed_at = $${i++}`); values.push(completed_at); }
    if (user_rating !== undefined) { updates.push(`user_rating = $${i++}`); values.push(user_rating >= 1 && user_rating <= 5 ? user_rating : null); }
    if (user_feedback !== undefined) { updates.push(`user_feedback = $${i++}`); values.push(user_feedback); }
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id, req.userId);
    const { rows } = await query(
      `UPDATE ride_history SET ${updates.join(", ")} WHERE id = $${i} AND (user_id = $${i + 1} OR driver_id = $${i + 1}) RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: "Ride not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update ride" });
  }
});

export default router;
