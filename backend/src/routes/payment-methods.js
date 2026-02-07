import express from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, user_id, type, provider, account_number_masked, is_default, created_at FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
      [req.userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch payment methods" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { type, provider, account_number_masked, is_default } = req.body;
    if (!type) return res.status(400).json({ error: "type required" });
    if (!!is_default) {
      await query("UPDATE payment_methods SET is_default = false WHERE user_id = $1", [req.userId]);
    }
    const { rows } = await query(
      `INSERT INTO payment_methods (user_id, type, provider, account_number_masked, is_default)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, type, provider, account_number_masked, is_default, created_at`,
      [req.userId, type, provider || null, account_number_masked || null, !!is_default]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create payment method" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_default } = req.body;
    const { rows: existing } = await query(
      "SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );
    if (!existing.length) return res.status(404).json({ error: "Payment method not found" });
    if (is_default === true) {
      await query("UPDATE payment_methods SET is_default = false WHERE user_id = $1", [req.userId]);
      await query("UPDATE payment_methods SET is_default = true, updated_at = now() WHERE id = $1", [id]);
    }
    const { rows } = await query(
      "SELECT id, user_id, type, provider, account_number_masked, is_default, created_at FROM payment_methods WHERE id = $1",
      [id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update payment method" });
  }
});

export default router;
