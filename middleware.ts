import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-dev-secret-change-in-production"
);

const PROTECTED_PATHS = ["/dashboard", "/presentation", "/admin"];
const ADMIN_PATHS = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("session_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    // Block unapproved users from protected routes
    if (payload.status !== "approved") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Block non-admins from admin routes
    if (isAdmin && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/presentation/:path*", "/admin/:path*"],
};
