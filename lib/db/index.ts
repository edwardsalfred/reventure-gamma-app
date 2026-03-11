import { sql } from "@vercel/postgres";

export { sql };

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
);
`;
