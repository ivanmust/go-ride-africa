import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarsDir = path.join(__dirname, "..", "..", "uploads", "avatars");
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname) || ".jpg"}`),
});
const upload = multer({ storage });
const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, email, phone, full_name, avatar_url, created_at, updated_at, is_driver_approved FROM profiles WHERE id = $1",
      [req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: "Profile not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, email, phone, full_name, avatar_url, is_driver_approved FROM profiles WHERE id = $1",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Profile not found" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { full_name, phone, avatar_url } = req.body;
    const updates = [];
    const values = [];
    let i = 1;
    if (full_name !== undefined) { updates.push(`full_name = $${i++}`); values.push(full_name); }
    if (phone !== undefined) { updates.push(`phone = $${i++}`); values.push(phone); }
    if (avatar_url !== undefined) { updates.push(`avatar_url = $${i++}`); values.push(avatar_url); }
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.userId);
    const { rows } = await query(
      `UPDATE profiles SET ${updates.join(", ")}, updated_at = now() WHERE id = $${i} RETURNING id, email, phone, full_name, avatar_url, updated_at, is_driver_approved`,
      values
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.post("/me/avatar", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
    await query("UPDATE profiles SET avatar_url = $1, updated_at = now() WHERE id = $2", [avatarUrl, req.userId]);
    res.json({ avatar_url: avatarUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});

export default router;
