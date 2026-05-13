import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.GUARDIAN_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ keyPresent: false, message: "GUARDIAN_API_KEY env var is not set" });
  }

  const url = `https://content.guardianapis.com/search?api-key=${apiKey}&page-size=1&order-by=newest`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    return NextResponse.json({
      keyPresent: true,
      keyPreview: `${apiKey.substring(0, 8)}...`,
      status: res.status,
      statusText: res.statusText,
      body: text.slice(0, 500),
    });
  } catch (err) {
    return NextResponse.json({
      keyPresent: true,
      keyPreview: `${apiKey.substring(0, 8)}...`,
      fetchError: err instanceof Error ? err.message : String(err),
    });
  }
}
