import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { query } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "..", "uploads", "driver-documents");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const router = express.Router();
const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";

router.get("/", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT id, user_id, document_type, file_name, file_path, status, rejection_reason, uploaded_at, reviewed_at FROM driver_documents WHERE user_id = $1 ORDER BY uploaded_at DESC",
      [req.userId]
    );
    res.json(rows.map((r) => ({ ...r, file_path: r.file_path ? `${baseUrl}/${r.file_path}` : null })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.post("/", requireAuth, requireRole("driver"), upload.single("file"), async (req, res) => {
  try {
    const { document_type } = req.body;
    if (!document_type || !req.file) return res.status(400).json({ error: "document_type and file required" });
    const filePath = `uploads/driver-documents/${req.file.filename}`;
    const { rows } = await query(
      `INSERT INTO driver_documents (user_id, document_type, file_path, file_name, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (user_id, document_type) DO UPDATE SET file_path = $3, file_name = $4, status = 'pending', uploaded_at = now()
       RETURNING id, user_id, document_type, file_name, file_path, status, uploaded_at`,
      [req.userId, document_type, filePath, req.file.originalname]
    );
    res.status(201).json({ ...rows[0], file_path: `${baseUrl}/${filePath}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

router.delete("/:id", requireAuth, requireRole("driver"), async (req, res) => {
  try {
    const { rows } = await query("SELECT file_path FROM driver_documents WHERE id = $1 AND user_id = $2 AND status = 'pending'", [req.params.id, req.userId]);
    if (!rows[0]) return res.status(404).json({ error: "Document not found or cannot delete" });
    const { rowCount } = await query("DELETE FROM driver_documents WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
    res.status(rowCount ? 204 : 404).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

export default router;
