import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getSessionFromRequest } from "@/lib/auth/session";
import { checkGenerationStatus } from "@/lib/api-clients/gamma";
import { Presentation } from "@/types/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.sub, 10);
  const presentationId = parseInt(params.id, 10);

  const { rows } = await sql<Presentation>`
    SELECT * FROM presentations
    WHERE id = ${presentationId} AND user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
  }

  const presentation = rows[0];

  // Already done — return immediately
  if (presentation.status === "completed" || presentation.status === "failed") {
    return NextResponse.json(presentation);
  }

  // Poll Gamma for status
  try {
    const gammaStatus = await checkGenerationStatus(
      presentation.gamma_generation_id
    );

    if (gammaStatus.status === "completed" && gammaStatus.gammaUrl) {
      await sql`
        UPDATE presentations
        SET status = 'completed', gamma_url = ${gammaStatus.gammaUrl}, completed_at = NOW()
        WHERE id = ${presentationId}
      `;
      return NextResponse.json({
        ...presentation,
        status: "completed",
        gamma_url: gammaStatus.gammaUrl,
        completed_at: new Date().toISOString(),
      });
    }

    if (gammaStatus.status === "failed") {
      await sql`
        UPDATE presentations
        SET status = 'failed', error_message = 'Gamma generation failed'
        WHERE id = ${presentationId}
      `;
      return NextResponse.json({
        ...presentation,
        status: "failed",
        error_message: "Gamma generation failed",
      });
    }

    // Still pending/processing
    await sql`
      UPDATE presentations SET status = 'processing' WHERE id = ${presentationId} AND status = 'pending'
    `;

    return NextResponse.json({ ...presentation, status: "processing" });
  } catch (err) {
    console.error("Gamma status check error:", err);
    return NextResponse.json({ ...presentation, status: "processing" });
  }
}
