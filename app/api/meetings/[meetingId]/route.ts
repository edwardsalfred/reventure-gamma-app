import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getMeetingWithTranscript } from "@/lib/api-clients/fireflies";

export async function GET(
  req: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getMeetingWithTranscript(params.meetingId);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Fireflies meeting detail error:", err);
    const status =
      (err as { response?: { status?: number } })?.response?.status || 500;
    if (status === 404) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to fetch meeting details" },
      { status: 502 }
    );
  }
}
