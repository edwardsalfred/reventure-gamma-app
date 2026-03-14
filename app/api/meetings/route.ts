import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { listMeetings } from "@/lib/api-clients/readai";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor") || undefined;

  try {
    const data = await listMeetings(cursor);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Read.ai meetings error:", err);
    const axiosErr = err as { response?: { status?: number }; message?: string };
    const status = axiosErr?.response?.status || 500;
    if (status === 429) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    if (status === 401) {
      return NextResponse.json(
        { error: "Read.ai token expired. Please re-authenticate at /api/auth/readai" },
        { status: 502 }
      );
    }
    const detail = axiosErr?.message || "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch meetings from Read.ai: ${detail}` },
      { status: 502 }
    );
  }
}
