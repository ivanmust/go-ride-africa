#!/usr/bin/env node
/**
 * Add is_active column to users table (for existing DBs).
 * Uses DATABASE_URL from backend/.env.
 *
 * From project root: node scripts/apply-migration-is-active.mjs
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

const backendEnv = resolve(backendDir, ".env");
const rootEnv = resolve(root, ".env");

function loadEnv() {
  const path = existsSync(backendEnv) ? backendEnv : existsSync(rootEnv) ? rootEnv : null;
  if (!path) {
    console.error("No .env found. Create backend/.env with DATABASE_URL.");
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

const migrationPath = resolve(backendDir, "postgres", "migrations", "001_add_users_is_active.sql");
if (!existsSync(migrationPath)) {
  console.error("Migration file not found:", migrationPath);
  process.exit(1);
}

const sql = readFileSync(migrationPath, "utf8");
const pool = new pg.Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("Migration applied: users.is_active column added.");
  } catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
