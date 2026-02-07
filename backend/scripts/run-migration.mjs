#!/usr/bin/env node
/**
 * Run a migration file against DATABASE_URL (backend/.env).
 * Usage from backend: node scripts/run-migration.mjs [migration-file]
 * Example: node scripts/run-migration.mjs postgres/migrations/003_ride_sharing_and_functions.sql
 */
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, "..");
dotenv.config({ path: resolve(backendDir, ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Set it in backend/.env");
  process.exit(1);
}

const migrationFile = process.argv[2] || "postgres/migrations/003_ride_sharing_and_functions.sql";
const migrationPath = resolve(backendDir, migrationFile);

async function main() {
  const sql = readFileSync(migrationPath, "utf8");
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    await client.query(sql);
    console.log("Migration applied:", migrationFile);
  } catch (e) {
    console.error("Migration failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
