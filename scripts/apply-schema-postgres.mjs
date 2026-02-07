#!/usr/bin/env node
/**
 * Apply backend/postgres/schema.sql to the database (no psql required).
 * Uses DATABASE_URL from backend/.env and backend/node_modules/pg.
 *
 * From project root:
 *   npm run apply-schema-postgres
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

const backendEnv = resolve(root, "backend", ".env");
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

const schemaPath = resolve(backendDir, "postgres", "schema.sql");
if (!existsSync(schemaPath)) {
  console.error("Schema file not found:", schemaPath);
  process.exit(1);
}

const sql = readFileSync(schemaPath, "utf8");
const pool = new pg.Pool({ connectionString: databaseUrl });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("Schema applied successfully.");
  } catch (e) {
    console.error("Schema apply failed:", e.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
