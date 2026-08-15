// PostgreSQL connection (Supabase or any Postgres). A single pooled connection is
// created at module scope so it's reused across warm serverless invocations on Vercel.
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// POSTGRES_URL is what Vercel's native Supabase integration injects (already the
// pooled/serverless-safe connection string). DATABASE_URL is kept as a fallback so the
// same code works with a manually-configured Postgres/Supabase connection.
const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.warn('POSTGRES_URL / DATABASE_URL is not set — database calls will fail until one is configured.');
}

const pool = new pg.Pool({
  connectionString,
  // Supabase's pooler requires SSL; disable strict CA checking since Supabase uses a
  // managed cert chain that Node doesn't always have bundled.
  ssl: connectionString ? { rejectUnauthorized: false } : undefined,
  max: 5,
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function migrate() {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await pool.query(sql);
}

export default { query, migrate };
