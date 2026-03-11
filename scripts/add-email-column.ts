import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function migrate() {
  console.log("Adding email column to users table...");
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`;
  console.log("Done.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
