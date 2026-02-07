import jwt from "jsonwebtoken";
import { query } from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is required");

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.role = payload.role;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export async function getRoleForUser(userId) {
  const { rows } = await query(
    "SELECT role FROM user_roles WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return rows[0]?.role ?? null;
}
