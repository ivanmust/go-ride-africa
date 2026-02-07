import express from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const rideId = req.query.ride_id;
    if (!rideId) return res.status(400).json({ error: "ride_id required" });
    const { rows } = await query(
      `SELECT rm.* FROM ride_messages rm
       INNER JOIN ride_history rh ON rh.id = rm.ride_id
       WHERE rm.ride_id = $1 AND (rh.user_id = $2 OR rh.driver_id = $2)
       ORDER BY rm.created_at ASC`,
      [rideId, req.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { ride_id, message, sender_type } = req.body;
    if (!ride_id || !message) return res.status(400).json({ error: "ride_id and message required" });
    const type = (sender_type === "driver" || req.role === "driver") ? "driver" : "passenger";
    const { rows } = await query(
      `INSERT INTO ride_messages (ride_id, sender_id, sender_type, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, ride_id, sender_id, sender_type, message, is_read, created_at`,
      [ride_id, req.userId, type, message]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.patch("/mark-read", requireAuth, async (req, res) => {
  try {
    const { ride_id } = req.body;
    if (!ride_id) return res.status(400).json({ error: "ride_id required" });
    await query(
      `UPDATE ride_messages SET is_read = true
       WHERE ride_id = $1 AND sender_id != $2 AND EXISTS (
         SELECT 1 FROM ride_history WHERE id = ride_messages.ride_id AND (user_id = $2 OR driver_id = $2)
       )`,
      [ride_id, req.userId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

export default router;
