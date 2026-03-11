import { NextResponse } from "next/server";
import { clearCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(clearCookieOptions());
  return response;
}
