import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type NewsArticle = {
  id: string;
  title: string;
  section: string;
  url: string;
  thumbnail: string | null;
  publishedAt: string;
  trailText: string | null;
  byline: string | null;
};

const SECTION_MAP: Record<string, string | null> = {
  top:        null, // no filter — all sections
  politics:   "politics",
  business:   "business",
  technology: "technology",
  culture:    "culture",
  sport:      "sport",
};

export async function GET(req: NextRequest) {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, articles: [] });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "top";
  const section = SECTION_MAP[category] ?? null;

  const params: Record<string, string> = {
    "api-key": apiKey,
    "show-fields": "trailText,thumbnail,byline",
    "page-size": "20",
    "order-by": "newest",
  };
  if (section) params["section"] = section;

  const qs = new URLSearchParams(params).toString();
  const url = `https://content.guardianapis.com/search?${qs}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({
        configured: true,
        articles: [],
        error: `Guardian API returned ${res.status}: ${text.slice(0, 200)}`,
      });
    }

    const data = JSON.parse(text);
    const articles: NewsArticle[] = (data.response?.results ?? []).map((item: {
      id: string;
      webTitle: string;
      sectionName: string;
      webUrl: string;
      webPublicationDate: string;
      fields?: { thumbnail?: string; trailText?: string; byline?: string };
    }) => ({
      id: item.id,
      title: item.webTitle,
      section: item.sectionName,
      url: item.webUrl,
      thumbnail: item.fields?.thumbnail ?? null,
      publishedAt: item.webPublicationDate,
      trailText: item.fields?.trailText ?? null,
      byline: item.fields?.byline ?? null,
    }));

    return NextResponse.json({ configured: true, articles });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      articles: [],
      error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
