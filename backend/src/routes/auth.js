import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db.js";
import { getRoleForUser, requireAuth } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PASSWORD_RESET_EXPIRY = "1h";

router.post("/register", async (req, res) => {
  try {
    const { email, password, phone, full_name, requested_role = "passenger" } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const role = ["passenger", "driver"].includes(requested_role) ? requested_role : "passenger";
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, phone, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, phone, full_name, created_at`,
      [email, password_hash, phone || null, full_name || null]
    );
    const user = rows[0];
    await query(
      "INSERT INTO profiles (id, email, phone, full_name) VALUES ($1, $2, $3, $4)",
      [user.id, user.email, user.phone, user.full_name]
    );
    await query("INSERT INTO user_roles (user_id, role) VALUES ($1, $2)", [user.id, role]);
    const token = jwt.sign(
      { sub: user.id, role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({
      user: { id: user.id, email: user.email, phone: user.phone, full_name: user.full_name },
      role,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (e) {
    if (e.code === "23505") return res.status(400).json({ error: "Email already registered" });
    console.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const emailTrimmed = typeof email === "string" ? email.trim() : "";
    const { rows } = await query(
      "SELECT id, email, password_hash, phone, full_name, is_active FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [emailTrimmed]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (!user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: "Account is deactivated. Contact support to reactivate." });
    }
    const role = await getRoleForUser(user.id);
    if (!role) return res.status(401).json({ error: "No role assigned" });
    const token = jwt.sign(
      { sub: user.id, role, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      user: { id: user.id, email: user.email, phone: user.phone, full_name: user.full_name },
      role,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows: userRows } = await query(
      "SELECT is_active FROM users WHERE id = $1",
      [payload.sub]
    );
    if (!userRows[0] || userRows[0].is_active === false) {
      return res.status(403).json({ error: "Account is deactivated" });
    }
    const { rows } = await query(
      "SELECT id, email, phone, full_name, avatar_url, created_at, updated_at, is_driver_approved FROM profiles WHERE id = $1",
      [payload.sub]
    );
    const profile = rows[0];
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    const role = await getRoleForUser(payload.sub);
    res.json({ user: profile, role: role || payload.role });
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email required" });
    }
    const { rows } = await query(
      "SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) AND is_active = true",
      [email.trim()]
    );
    const user = rows[0];
    if (user) {
      const resetToken = jwt.sign(
        { sub: user.id, type: "password_reset" },
        JWT_SECRET,
        { expiresIn: PASSWORD_RESET_EXPIRY }
      );
      const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;
      return res.json({
        message: "If an account exists, you will receive reset instructions.",
        reset_link: resetLink,
      });
    }
    res.json({
      message: "If an account exists, you will receive reset instructions.",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Request failed" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password || typeof new_password !== "string") {
      return res.status(400).json({ error: "Token and new password required" });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "Invalid or expired reset link. Request a new one." });
    }
    if (payload.type !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset link" });
    }
    const password_hash = await bcrypt.hash(new_password, 10);
    await query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [
      password_hash,
      payload.sub,
    ]);
    res.json({ message: "Password updated. You can now log in." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Request failed" });
  }
});

router.post("/deactivate", requireAuth, async (req, res) => {
  try {
    await query("UPDATE users SET is_active = false, updated_at = now() WHERE id = $1", [
      req.userId,
    ]);
    res.json({ message: "Account deactivated." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Request failed" });
  }
});

export default router;
