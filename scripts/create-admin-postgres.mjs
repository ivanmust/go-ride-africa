#!/usr/bin/env node
/**
 * Create an admin user for the Postgres backend (when using VITE_API_URL).
 *
 * From project root:
 *   npm run create-admin-postgres -- admin@example.com YourSecurePassword
 *
 * Requires backend/.env with DATABASE_URL. Uses backend/node_modules for pg and bcryptjs.
 * - If the email already exists: adds the admin role to that user.
 * - If not: creates the user, profile, and admin role.
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
const backendEnv = resolve(root, "backend", ".env");
const rootEnv = resolve(root, ".env");

function loadEnv() {
  const path = existsSync(backendEnv) ? backendEnv : existsSync(rootEnv) ? rootEnv : null;
  if (!path) {
    console.error("No .env found. Create backend/.env with DATABASE_URL and JWT_SECRET.");
    process.exit(1);
  }
  const raw = readFileSync(path, "utf8");
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
  console.error("DATABASE_URL is missing in backend/.env");
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: npm run create-admin-postgres -- <email> <password>");
  process.exit(1);
}

if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    const existingUser = existing[0];

    if (existingUser) {
      await client.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')
         ON CONFLICT (user_id, role) DO NOTHING`,
        [existingUser.id]
      );
      console.log("Admin role added for existing user. Sign in at the Admin portal with:", email);
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { rows: inserted } = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name`,
      [email, password_hash, "Admin"]
    );
    const user = inserted[0];
    if (!user) {
      console.error("Insert failed.");
      process.exit(1);
    }
    await client.query(
      "INSERT INTO profiles (id, email, full_name) VALUES ($1, $2, $3)",
      [user.id, user.email, user.full_name]
    );
    await client.query(
      "INSERT INTO user_roles (user_id, role) VALUES ($1, 'admin')",
      [user.id]
    );
    console.log("Admin user created. Sign in at the Admin portal with:", email);
  } catch (e) {
    if (e.code === "23505") {
      console.error("Email already registered. Run the script again to add the admin role.");
    } else if (e.message && e.message.includes("does not exist")) {
      console.error("Database schema not applied. Run first: npm run apply-schema-postgres");
      console.error("Then run this script again.");
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
