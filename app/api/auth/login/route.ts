import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/middleware";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));

  if (!process.env.SITE_PASSWORD || !process.env.COOKIE_SECRET) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, process.env.COOKIE_SECRET, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
