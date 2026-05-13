import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type StockData = {
  configured: boolean;
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  history: { date: string; close: number }[];
  error?: string;
};

const RANGE_PARAMS: Record<string, { range: string; interval: string; intraday: boolean }> = {
  "1D": { range: "1d",  interval: "5m",  intraday: true  },
  "1W": { range: "5d",  interval: "1d",  intraday: false },
  "1M": { range: "1mo", interval: "1d",  intraday: false },
  "6M": { range: "6mo", interval: "1d",  intraday: false },
  "1Y": { range: "1y",  interval: "1wk", intraday: false },
};

const EMPTY = (symbol: string, companyName = symbol) => ({
  configured: true, symbol, companyName,
  price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0, history: [],
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "").toUpperCase().trim();
  const range  = searchParams.get("range") ?? "1M";

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  const params = RANGE_PARAMS[range] ?? RANGE_PARAMS["1M"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${params.interval}&range=${params.range}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ...EMPTY(symbol), error: `${res.status}: ${text.slice(0, 150)}` });
    }

    const data   = await res.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      const err = data?.chart?.error;
      return NextResponse.json({
        ...EMPTY(symbol),
        error: err ? `${err.code}: ${err.description}` : `"${symbol}" not found`,
      });
    }

    const meta        = result.meta;
    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[]     = result.indicators?.quote?.[0]?.close ?? [];
    const companyName: string  = meta.longName ?? meta.shortName ?? symbol;

    let history: { date: string; close: number }[];

    if (params.intraday) {
      // Keep every bar; store full ISO string so the frontend can format as time
      history = timestamps
        .map((t, i) => ({ date: new Date(t * 1000).toISOString(), close: closes[i] }))
        .filter((p) => p.close != null);
    } else {
      // One point per calendar day (last bar of day wins)
      const byDate = new Map<string, number>();
      timestamps.forEach((t, i) => {
        if (closes[i] != null) {
          byDate.set(new Date(t * 1000).toISOString().substring(0, 10), closes[i]);
        }
      });
      history = Array.from(byDate.entries()).map(([date, close]) => ({ date, close }));
    }

    const price        = meta.regularMarketPrice ?? 0;
    const prevClose    = meta.chartPreviousClose ?? meta.previousClose ?? 0;
    const change       = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    return NextResponse.json({
      configured: true,
      symbol: meta.symbol ?? symbol,
      companyName,
      price,
      change,
      changePercent,
      high:      meta.regularMarketDayHigh ?? 0,
      low:       meta.regularMarketDayLow  ?? 0,
      open:      meta.regularMarketOpen    ?? 0,
      prevClose,
      history,
    } satisfies StockData);
  } catch (err) {
    return NextResponse.json({
      ...EMPTY(symbol),
      error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
