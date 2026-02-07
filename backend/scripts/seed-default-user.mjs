#!/usr/bin/env node
/**
 * Create a default passenger user so you can log in on a fresh database.
 * Run from backend: npm run seed-default-user
 *
 * Default login: passenger@example.com / Passenger1
 */
import "dotenv/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, "..");

const DEFAULT_EMAIL = "passenger@example.com";
const DEFAULT_PASSWORD = "Passenger1";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set in backend/.env");
  process.exit(1);
}

async function main() {
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [DEFAULT_EMAIL]
    );
    if (existing.length > 0) {
      console.log("Default user already exists:", DEFAULT_EMAIL);
      return;
    }
    const password_hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const { rows: users } = await client.query(
      `INSERT INTO users (email, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name`,
      [DEFAULT_EMAIL, password_hash, "Passenger"]
    );
    const user = users[0];
    await client.query(
      "INSERT INTO profiles (id, email, full_name) VALUES ($1, $2, $3)",
      [user.id, user.email, user.full_name]
    );
    await client.query(
      "INSERT INTO user_roles (user_id, role) VALUES ($1, 'passenger') ON CONFLICT (user_id, role) DO NOTHING",
      [user.id]
    );
    console.log("Default user created. You can log in with:");
    console.log("  Email:", DEFAULT_EMAIL);
    console.log("  Password:", DEFAULT_PASSWORD);
  } catch (e) {
    console.error("Seed failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
