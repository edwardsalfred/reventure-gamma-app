import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { listMeetings } from "@/lib/api-clients/fireflies";

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
    console.error("Fireflies meetings error:", err);
    const apiErr = err as { response?: { status?: number }; message?: string };
    const status = apiErr?.response?.status || 500;
    if (status === 429) {
      return NextResponse.json(
        { error: "Rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    const detail = apiErr?.message || "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch meetings from Fireflies: ${detail}` },
      { status: 502 }
    );
  }
}
