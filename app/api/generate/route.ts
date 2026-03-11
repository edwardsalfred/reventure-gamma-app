import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getSessionFromRequest } from "@/lib/auth/session";
import { generateProposal } from "@/lib/api-clients/anthropic";
import { createPresentation } from "@/lib/api-clients/gamma";
import { TranscriptLine } from "@/types/readai";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { meetingId, meetingTitle, transcript } = await req.json() as {
    meetingId: string;
    meetingTitle: string;
    transcript: TranscriptLine[];
  };

  if (!meetingId || !meetingTitle || !transcript || !Array.isArray(transcript)) {
    return NextResponse.json(
      { error: "meetingId, meetingTitle, and transcript are required" },
      { status: 400 }
    );
  }

  const userId = parseInt(session.sub, 10);

  // Step 1: Generate proposal with Claude
  let proposalText: string;
  try {
    proposalText = await generateProposal(transcript, meetingTitle);
  } catch (err) {
    console.error("Claude generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate proposal with AI. Please try again." },
      { status: 502 }
    );
  }

  // Step 2: Create presentation with Gamma
  let gammaGenerationId: string;
  try {
    const result = await createPresentation(proposalText, meetingTitle);
    gammaGenerationId = result.generationId;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
    console.error("Gamma creation error:", axiosErr?.response?.data || axiosErr?.message || err);
    const detail = JSON.stringify(axiosErr?.response?.data || axiosErr?.message || "unknown");
    return NextResponse.json(
      { error: `Failed to create presentation with Gamma: ${detail}` },
      { status: 502 }
    );
  }

  // Step 3: Save to database
  const { rows } = await sql<{ id: number }>`
    INSERT INTO presentations
      (user_id, meeting_id, meeting_title, gamma_generation_id, proposal_text, status)
    VALUES
      (${userId}, ${meetingId}, ${meetingTitle}, ${gammaGenerationId}, ${proposalText}, 'pending')
    RETURNING id
  `;

  const presentationId = rows[0].id;

  return NextResponse.json(
    { presentationId, gammaGenerationId, status: "pending" },
    { status: 202 }
  );
}
