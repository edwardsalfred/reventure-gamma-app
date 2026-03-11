import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getSessionFromRequest } from "@/lib/auth/session";
import { Presentation } from "@/types/db";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.sub, 10);

  const { rows } = await sql<Presentation>`
    SELECT id, user_id, meeting_id, meeting_title, gamma_generation_id,
           gamma_url, status, error_message, created_at, completed_at
    FROM presentations
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ presentations: rows });
}
