#!/usr/bin/env node
/**
 * Apply backend/postgres/schema.sql to the database in DATABASE_URL.
 * Run from project root: npm run apply-schema-postgres (from backend)
 * Or: node backend/scripts/apply-schema-postgres.mjs (from root)
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = resolve(__dirname, "..");
const schemaPath = resolve(backendDir, "postgres", "schema.sql");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Create backend/.env with DATABASE_URL.");
  process.exit(1);
}

async function main() {
  const sql = readFileSync(schemaPath, "utf8");
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    await client.query(sql);
    console.log("Schema applied successfully from postgres/schema.sql");
  } catch (e) {
    console.error("Schema apply failed:", e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
