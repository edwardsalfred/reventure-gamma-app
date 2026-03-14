import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getSession } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://reventure-gamma-app.vercel.app";

// GET /api/auth/readai/callback — exchange auth code for tokens and save to DB
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(
      `${BASE_URL}/admin/users?readai=error&detail=${encodeURIComponent("No authorization code provided")}`
    );
  }

  const clientId = process.env.READ_AI_CLIENT_ID!;
  const clientSecret = process.env.READ_AI_CLIENT_SECRET!;
  const redirectUri = `${BASE_URL}/api/auth/readai/callback`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://authn.read.ai/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Read.ai token exchange failed:", response.status, text);
    return NextResponse.redirect(
      `${BASE_URL}/admin/users?readai=error&detail=${encodeURIComponent(`Token exchange failed: ${response.status} ${text}`)}`
    );
  }

  const data = await response.json();

  if (!data.refresh_token) {
    console.error("Read.ai token response missing refresh_token:", data);
    return NextResponse.redirect(
      `${BASE_URL}/admin/users?readai=error&detail=${encodeURIComponent("No refresh token returned — ensure offline_access scope is enabled in your Read.ai OAuth app")}`
    );
  }

  // Save refresh token to DB
  try {
    await sql`
      INSERT INTO settings (key, value) VALUES ('read_ai_refresh_token', ${data.refresh_token})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  } catch (err) {
    console.error("Failed to save Read.ai refresh token to DB:", err);
    return NextResponse.redirect(
      `${BASE_URL}/admin/users?readai=error&detail=${encodeURIComponent("Failed to save token to database — check DB connection")}`
    );
  }

  return NextResponse.redirect(`${BASE_URL}/admin/users?readai=connected`);
}
