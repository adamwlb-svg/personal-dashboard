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

const RANGE_DAYS: Record<string, number> = {
  "1W": 7,
  "1M": 30,
  "6M": 182,
  "1Y": 365,
};

// Candle resolution by range
const RANGE_RESOLUTION: Record<string, string> = {
  "1W": "30",  // 30-minute bars
  "1M": "D",
  "6M": "D",
  "1Y": "W",
};

export async function GET(req: NextRequest) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, symbol: "", price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0, history: [] });
  }

  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "").toUpperCase().trim();
  const range = searchParams.get("range") ?? "1M";

  if (!symbol) {
    return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const days = RANGE_DAYS[range] ?? 30;
  const from = now - days * 86400;
  const resolution = RANGE_RESOLUTION[range] ?? "D";

  try {
    const [quoteRes, candleRes] = await Promise.all([
      fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`, { cache: "no-store" }),
      fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${now}&token=${apiKey}`, { cache: "no-store" }),
    ]);

    if (!quoteRes.ok || !candleRes.ok) {
      const quoteText = !quoteRes.ok ? await quoteRes.text() : "";
      const candleText = !candleRes.ok ? await candleRes.text() : "";
      const detail = !quoteRes.ok
        ? `Quote ${quoteRes.status}: ${quoteText.slice(0, 120)}`
        : `Candle ${candleRes.status}: ${candleText.slice(0, 120)}`;
      return NextResponse.json({ configured: true, error: detail, symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0, history: [] });
    }

    const quote = await quoteRes.json();
    const candles = await candleRes.json();

    // Finnhub returns c=0 for unknown symbols
    if (!quote.c && quote.c !== 0) {
      return NextResponse.json({ configured: true, error: "Symbol not found", symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0, history: [] });
    }
    if (quote.c === 0 && quote.pc === 0) {
      return NextResponse.json({ configured: true, error: "Symbol not found", symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0, history: [] });
    }

    const history: { date: string; close: number }[] =
      candles.s === "ok"
        ? candles.t.map((t: number, i: number) => ({
            date: new Date(t * 1000).toISOString().substring(0, 10),
            close: candles.c[i],
          }))
        : [];

    const result: StockData = {
      configured: true,
      symbol,
      price: quote.c,
      change: quote.d ?? 0,
      changePercent: quote.dp ?? 0,
      high: quote.h ?? 0,
      low: quote.l ?? 0,
      open: quote.o ?? 0,
      prevClose: quote.pc ?? 0,
      history,
    };

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({
      configured: true,
      error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      symbol, price: 0, change: 0, changePercent: 0, high: 0, low: 0, open: 0, prevClose: 0, history: [],
    });
  }
}
