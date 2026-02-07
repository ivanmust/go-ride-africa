import express from "express";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT driver_id, is_online, updated_at FROM driver_availability WHERE is_online = true"
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch driver availability" });
  }
});

router.put("/me", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const { is_online } = req.body;
    const { rows } = await query(
      `INSERT INTO driver_availability (driver_id, is_online, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (driver_id) DO UPDATE SET is_online = $2, updated_at = now()
       RETURNING driver_id, is_online, updated_at`,
      [req.userId, !!is_online]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update availability" });
  }
});

router.get("/me", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT driver_id, is_online, updated_at FROM driver_availability WHERE driver_id = $1",
      [req.userId]
    );
    res.json(rows[0] || { driver_id: req.userId, is_online: false, updated_at: null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// Online approved drivers with locations (for passenger map)
router.get("/online-drivers", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT da.driver_id AS "driverId", p.full_name AS "fullName", p.avatar_url AS "avatarUrl",
              ul.latitude, ul.longitude, ul.updated_at AS "updatedAt"
       FROM driver_availability da
       JOIN profiles p ON p.id = da.driver_id AND p.is_driver_approved = true
       JOIN user_locations ul ON ul.user_id = da.driver_id
       WHERE da.is_online = true AND ul.latitude IS NOT NULL AND ul.longitude IS NOT NULL`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch online drivers" });
  }
});

export default router;
