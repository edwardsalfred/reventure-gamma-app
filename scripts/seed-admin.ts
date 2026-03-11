import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const username = process.argv[2] || "admin";
const password = process.argv[3];

if (!password) {
  console.error("Usage: npx tsx scripts/seed-admin.ts <username> <password>");
  process.exit(1);
}

async function seedAdmin() {
  console.log(`Creating admin user: ${username}`);

  const hash = await bcrypt.hash(password, 12);

  await sql`
    INSERT INTO users (username, password_hash, role, status)
    VALUES (${username}, ${hash}, 'admin', 'approved')
    ON CONFLICT (username) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          role = 'admin',
          status = 'approved'
  `;

  console.log(`Admin user '${username}' created/updated successfully.`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err);
  process.exit(1);
});
