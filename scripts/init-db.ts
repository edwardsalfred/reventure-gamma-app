import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function initDb() {
  console.log("Initializing database schema...");

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      status        TEXT NOT NULL DEFAULT 'pending',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS presentations (
      id                    SERIAL PRIMARY KEY,
      user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      meeting_id            TEXT NOT NULL,
      meeting_title         TEXT NOT NULL,
      gamma_generation_id   TEXT NOT NULL UNIQUE,
      gamma_url             TEXT,
      status                TEXT NOT NULL DEFAULT 'pending',
      proposal_text         TEXT,
      error_message         TEXT,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at          TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

  console.log("Database schema initialized successfully.");
  process.exit(0);
}

initDb().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
