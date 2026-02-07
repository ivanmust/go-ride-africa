import express from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, user_id, name, label, address, latitude, longitude, created_at FROM saved_locations WHERE user_id = $1 ORDER BY created_at DESC",
      [req.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch saved locations" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, label, address, latitude, longitude } = req.body;
    if (!name || !address) return res.status(400).json({ error: "name and address required" });
    const { rows } = await query(
      `INSERT INTO saved_locations (user_id, name, label, address, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, name, label, address, latitude, longitude, created_at`,
      [req.userId, name, label || null, address, latitude ?? null, longitude ?? null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create saved location" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { name, label, address, latitude, longitude } = req.body;
    const updates = [];
    const values = [];
    let i = 1;
    if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
    if (label !== undefined) { updates.push(`label = $${i++}`); values.push(label); }
    if (address !== undefined) { updates.push(`address = $${i++}`); values.push(address); }
    if (latitude !== undefined) { updates.push(`latitude = $${i++}`); values.push(latitude); }
    if (longitude !== undefined) { updates.push(`longitude = $${i++}`); values.push(longitude); }
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id, req.userId);
    const { rows } = await query(
      `UPDATE saved_locations SET ${updates.join(", ")} WHERE id = $${i} AND user_id = $${i + 1} RETURNING *`,
      values
    );
    if (!rows[0]) return res.status(404).json({ error: "Saved location not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update saved location" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { rowCount } = await query("DELETE FROM saved_locations WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
    if (rowCount === 0) return res.status(404).json({ error: "Saved location not found" });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete saved location" });
  }
});

export default router;
