import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";
import { signSession, sessionCookieOptions } from "@/lib/auth/session";
import { User } from "@/types/db";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const { rows } = await sql<User>`
      SELECT * FROM users WHERE username = ${username} LIMIT 1
    `;

    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (user.status === "pending") {
      return NextResponse.json(
        {
          error:
            "Your account is pending approval. Please wait for an administrator to approve your account.",
        },
        { status: 403 }
      );
    }

    if (user.status === "rejected") {
      return NextResponse.json(
        { error: "Your account has been rejected. Please contact an administrator." },
        { status: 403 }
      );
    }

    const token = await signSession({
      sub: String(user.id),
      username: user.username,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role },
    });

    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
