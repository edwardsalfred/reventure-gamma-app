import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getSession } from "@/lib/auth";

// GET /api/auth/readai/callback — exchange auth code for tokens and save to DB
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
  }

  const clientId = process.env.READ_AI_CLIENT_ID!;
  const clientSecret = process.env.READ_AI_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/readai/callback`;

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
    return NextResponse.json(
      { error: `Failed to exchange token: ${response.status} ${text}` },
      { status: 500 }
    );
  }

  const data = await response.json();

  // Save refresh token to DB
  await sql`
    INSERT INTO settings (key, value) VALUES ('read_ai_refresh_token', ${data.refresh_token})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;

  // Redirect to dashboard with success message
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard?readai=connected`
  );
}
