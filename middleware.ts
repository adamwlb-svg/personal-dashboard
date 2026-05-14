import { NextRequest, NextResponse } from "next/server";

export const COOKIE_NAME = "pd_auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow login page and auth API
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = request.cookies.get(COOKIE_NAME)?.value;
  const secret  = process.env.COOKIE_SECRET;

  // If SITE_PASSWORD isn't configured, skip auth entirely (local dev without env vars)
  if (!process.env.SITE_PASSWORD) return NextResponse.next();

  if (!secret || !session || session !== secret) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
