import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SECTION_MAP: Record<string, string> = {
  top: "news",
  politics: "politics",
  business: "business",
  technology: "technology",
  culture: "culture",
  sport: "sport",
};

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

export async function GET(req: NextRequest) {
  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, articles: [] });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "top";
  const section = SECTION_MAP[category] ?? "news";

  const params = new URLSearchParams({
    "api-key": apiKey,
    "show-fields": "trailText,thumbnail,byline",
    "page-size": "20",
    "order-by": "newest",
  });

  if (category === "top") {
    params.set("section", "news|politics|business|technology|culture|sport");
  } else {
    params.set("section", section);
  }

  try {
    const res = await fetch(`https://content.guardianapis.com/search?${params}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json({ configured: true, articles: [], error: "Guardian API error" });
    }
    const data = await res.json();
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
  } catch {
    return NextResponse.json({ configured: true, articles: [], error: "Fetch failed" });
  }
}
