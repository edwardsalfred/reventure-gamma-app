import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// GET /api/auth/readai — redirect admin to Read.ai OAuth consent screen
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = process.env.READ_AI_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/readai/callback`;

  const url = new URL("https://authn.read.ai/oauth2/authorize");
  url.searchParams.set("client_id", clientId!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "offline_access read:meetings");

  return NextResponse.redirect(url.toString());
}
