import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getSessionFromRequest } from "@/lib/auth/session";
import { User } from "@/types/db";
import { sendUserApprovalNotification } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await sql<Omit<User, "password_hash">>`
    SELECT id, username, email, role, status, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ users: rows });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, action } = await req.json();

  if (!userId || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "userId and action (approve|reject) are required" },
      { status: 400 }
    );
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  const { rows } = await sql<{ id: number; username: string; email: string | null; status: string }>`
    UPDATE users
    SET status = ${newStatus}
    WHERE id = ${userId}
    RETURNING id, username, email, status
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updatedUser = rows[0];

  // Send approval email to the user (non-fatal if it fails)
  if (action === "approve" && updatedUser.email) {
    try {
      await sendUserApprovalNotification(updatedUser.username, updatedUser.email);
    } catch (emailErr) {
      console.error("Failed to send approval email:", emailErr);
    }
  }

  return NextResponse.json({ user: updatedUser });
}
