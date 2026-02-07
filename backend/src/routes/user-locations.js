import express from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Driver updates their own location (used by driver app while online)
router.put("/me", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (latitude == null || longitude == null) {
      return res.status(400).json({ error: "latitude and longitude required" });
    }
    const { rows } = await query(
      `INSERT INTO user_locations (user_id, latitude, longitude, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id) DO UPDATE SET latitude = $2, longitude = $3, updated_at = now()
       RETURNING user_id, latitude, longitude, updated_at`,
      [req.userId, latitude, longitude]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update location" });
  }
});

// Get the last known location for a given user (driver or passenger).
// For now this is protected by authentication only; the frontend limits
// usage to the matched driver for an active ride.
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { rows } = await query(
      `SELECT user_id, latitude, longitude, updated_at
       FROM user_locations
       WHERE user_id = $1`,
      [userId]
    );
    if (!rows[0]) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

export default router;
