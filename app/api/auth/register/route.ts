import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { sendAdminNewUserNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: "Username must be between 3 and 50 characters" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const { rows: existing } = await sql`
      SELECT id FROM users WHERE username = ${username} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 12);

    await sql`
      INSERT INTO users (username, email, password_hash, role, status)
      VALUES (${username}, ${email}, ${hash}, 'user', 'pending')
    `;

    // Notify admin of new signup (non-fatal if it fails)
    try {
      await sendAdminNewUserNotification(username, email);
    } catch (emailErr) {
      console.error("Failed to send admin notification email:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully. Your account is pending approval by an administrator.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
