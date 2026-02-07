#!/usr/bin/env node
/**
 * Fix login for an existing user: ensure they have a role and optionally set a new password.
 * Use when you get 401 "Invalid email or password" or "No role assigned" on login.
 *
 * From project root:
 *   node scripts/fix-user-login.mjs <email> [newPassword]
 *
 * Examples:
 *   node scripts/fix-user-login.mjs user@example.com
 *     → Adds "passenger" role if missing; does not change password.
 *   node scripts/fix-user-login.mjs user@example.com MyNewPassword123
 *     → Adds "passenger" role if missing AND sets password to the new one (use for accounts created manually in DB).
 *
 * Requires backend/.env with DATABASE_URL.
 */

import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const backendDir = resolve(root, "backend");
const require = createRequire(import.meta.url);
const pg = require(resolve(backendDir, "node_modules", "pg"));
const bcrypt = require(resolve(backendDir, "node_modules", "bcryptjs"));
const backendEnv = resolve(backendDir, ".env");

function loadEnv() {
  if (!existsSync(backendEnv)) {
    console.error("backend/.env not found. Set DATABASE_URL there.");
    process.exit(1);
  }
  const raw = readFileSync(backendEnv, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']?([^"'\n]*)["']?\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL missing in backend/.env");
  process.exit(1);
}

const listOnly = process.argv[2] === "--list";
const email = listOnly ? null : process.argv[2];
const newPassword = process.argv[3];

if (!email && !listOnly) {
  console.error("Usage: node scripts/fix-user-login.mjs <email> [newPassword]");
  console.error("       node scripts/fix-user-login.mjs --list   (list users in backend DB)");
  process.exit(1);
}

if (newPassword && newPassword.length < 6) {
  console.error("If provided, newPassword must be at least 6 characters.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  try {
    if (listOnly) {
      const { rows: users } = await client.query(
        "SELECT id, email, full_name FROM users ORDER BY email"
      );
      console.log("Users in backend DB (DATABASE_URL from backend/.env):", users.length);
      users.forEach((u) => console.log(" ", u.email, "|", u.full_name || "(no name)"));
      return;
    }

    const { rows: users } = await client.query(
      "SELECT id, email FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [email]
    );
    const user = users[0];
    if (!user) {
      console.error("No user found with email:", email);
      console.error("Create the account via the app Sign Up, or add the user and profile in the database first.");
      console.error("Tip: run  node scripts/fix-user-login.mjs --list  to see users in the DB the backend uses.");
      process.exit(1);
    }

    const { rows: roles } = await client.query(
      "SELECT role FROM user_roles WHERE user_id = $1",
      [user.id]
    );
    const hasPassenger = roles.some((r) => r.role === "passenger");
    const hasDriver = roles.some((r) => r.role === "driver");
    const hasAdmin = roles.some((r) => r.role === "admin");

    if (!hasPassenger && !hasDriver && !hasAdmin) {
      await client.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'passenger')
         ON CONFLICT (user_id, role) DO NOTHING`,
        [user.id]
      );
      console.log("Added 'passenger' role for", email, "- you can now sign in on the Rider app.");
    } else {
      console.log("User already has role(s):", roles.map((r) => r.role).join(", "));
    }

    if (newPassword) {
      const password_hash = await bcrypt.hash(newPassword, 10);
      await client.query(
        "UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2",
        [password_hash, user.id]
      );
      console.log("Password updated. Sign in with the new password.");
    }
  } catch (e) {
    if (e.message && e.message.includes("does not exist")) {
      console.error("Schema missing. Run: npm run apply-schema-postgres (or apply backend/postgres/schema.sql)");
    } else {
      console.error(e.message || e);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
