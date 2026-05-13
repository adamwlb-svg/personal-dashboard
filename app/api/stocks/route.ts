import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type StockData = {
  configured: boolean;
  symbol: string;
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

const RANGE_PARAMS: Record<string, { range: string; interval: string }> = {
  "1W": { range: "5d",  interval: "30m" },
  "1M": { range: "1mo", interval: "1d"  },
  "6M": { range: "6mo", interval: "1d"  },
  "1Y": { range: "1y",  interval: "1wk" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "").toUpperCase().trim();
  const range = searchParams.get("range") ?? "1M";

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  const { range: r, interval } = RANGE_PARAMS[range] ?? RANGE_PARAMS["1M"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${r}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        configured: true,
        error: `${res.status}: ${text.slice(0, 150)}`,
        symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0, history: [],
      });
    }

    const data = await res.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      const err = data?.chart?.error;
      return NextResponse.json({
        configured: true,
        error: err ? `${err.code}: ${err.description}` : `"${symbol}" not found`,
        symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0, history: [],
      });
    }

    const meta = result.meta;
    const timestamps: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

    // Build history, deduplicating intraday bars to one point per day (last bar)
    const byDate = new Map<string, number>();
    timestamps.forEach((t, i) => {
      if (closes[i] != null) {
        byDate.set(new Date(t * 1000).toISOString().substring(0, 10), closes[i]);
      }
    });
    const history = Array.from(byDate.entries()).map(([date, close]) => ({ date, close }));

    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? 0;
    const change = price - prevClose;
    const changePercent = prevClose ? (change / prevClose) * 100 : 0;

    const stockData: StockData = {
      configured: true,
      symbol: meta.symbol ?? symbol,
      price,
      change,
      changePercent,
      high: meta.regularMarketDayHigh ?? 0,
      low: meta.regularMarketDayLow ?? 0,
      open: meta.regularMarketOpen ?? 0,
      prevClose,
      history,
    };

    return NextResponse.json(stockData);
  } catch (err) {
    return NextResponse.json({
      configured: true,
      error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0, history: [],
    });
  }
}
