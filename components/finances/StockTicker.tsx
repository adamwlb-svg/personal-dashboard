"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { StockData } from "@/app/api/stocks/route";

type Range = "1W" | "1M" | "6M" | "1Y";
const RANGES: Range[] = ["1W", "1M", "6M", "1Y"];
const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"];
const STORAGE_KEY = "stockWatchlist";

// ── Sparkline chart ───────────────────────────────────────────────────────────

function StockChart({ history, positive }: { history: { date: string; close: number }[]; positive: boolean }) {
  if (history.length < 2) {
    return <div className="h-36 flex items-center justify-center text-xs text-fg-3">No chart data for this range</div>;
  }

  const W = 800;
  const H = 140;
  const prices = history.map((h) => h.close);
  const min = Math.min(...prices) * 0.999;
  const max = Math.max(...prices) * 1.001;
  const range = max - min || 1;

  const pts = prices
    .map((p, i) => `${(i / (prices.length - 1)) * W},${H - ((p - min) / range) * H}`)
    .join(" ");

  const color = positive ? "#34d399" : "#f87171";
  const gradId = `sg-${positive ? "up" : "dn"}`;

  // Y-axis labels
  const yLabels = [min, (min + max) / 2, max];

  // X-axis date labels (first, middle, last)
  const xDates = [history[0], history[Math.floor(history.length / 2)], history[history.length - 1]];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 144 }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#${gradId})`} />
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {/* Y labels */}
      <div className="absolute top-0 right-0 h-full flex flex-col justify-between py-1 pointer-events-none">
        {[...yLabels].reverse().map((v, i) => (
          <span key={i} className="text-xs text-fg-3 tabular-nums">${v.toFixed(2)}</span>
        ))}
      </div>
      {/* X labels */}
      <div className="flex justify-between mt-1 px-1">
        {xDates.map((d, i) => (
          <span key={i} className="text-xs text-fg-3">
            {new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StockTicker() {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [symbol, setSymbol]       = useState("AAPL");
  const [input, setInput]         = useState("AAPL");
  const [range, setRange]         = useState<Range>("1M");
  const [data, setData]           = useState<StockData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [addInput, setAddInput]   = useState("");
  const abortRef                  = useRef<AbortController | null>(null);

  // Load watchlist from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setWatchlist(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const fetchStock = useCallback(async (sym: string, r: Range) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(`/api/stocks?symbol=${sym}&range=${r}`, { signal: abortRef.current.signal });
      const d: StockData = await res.json();
      setData(d);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStock(symbol, range);
  }, [symbol, range, fetchStock]);

  function selectSymbol(sym: string) {
    setSymbol(sym);
    setInput(sym);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const s = input.trim().toUpperCase();
    if (s) selectSymbol(s);
  }

  function saveWatchlist(next: string[]) {
    setWatchlist(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addToWatchlist(sym: string) {
    const s = sym.trim().toUpperCase();
    if (!s || watchlist.includes(s)) return;
    saveWatchlist([...watchlist, s]);
    setAddInput("");
  }

  function removeFromWatchlist(sym: string) {
    saveWatchlist(watchlist.filter((s) => s !== sym));
  }

  const isPositive   = (data?.change ?? 0) >= 0;
  const inWatchlist  = watchlist.includes(symbol);
  const isConfigured = data?.configured !== false;

  return (
    <div className="bg-surface-raised border border-surface-border rounded-2xl overflow-hidden">
      <div className="flex min-h-[340px]">

        {/* ── Watchlist sidebar ──────────────────────────────── */}
        <div className="w-36 flex-shrink-0 border-r border-surface-border flex flex-col bg-surface">
          <p className="text-xs font-semibold text-fg-3 uppercase tracking-wider px-3 pt-3 pb-2">
            Watchlist
          </p>

          <div className="flex-1 overflow-y-auto">
            {watchlist.length === 0 && (
              <p className="text-xs text-fg-4 px-3 py-2">No symbols yet</p>
            )}
            {watchlist.map((fav) => (
              <div
                key={fav}
                className={`flex items-center justify-between px-2 py-1.5 group cursor-pointer transition-colors
                  ${symbol === fav ? "bg-accent/10" : "hover:bg-white/5"}`}
                onClick={() => selectSymbol(fav)}
              >
                <span className={`text-sm font-medium ${symbol === fav ? "text-accent" : "text-fg-2"}`}>
                  {fav}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromWatchlist(fav); }}
                  className="w-5 h-5 flex items-center justify-center rounded text-fg-4 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm leading-none flex-shrink-0"
                  title="Remove from watchlist"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add to watchlist */}
          <div className="p-2 border-t border-surface-border space-y-1.5">
            {/* Quick-add current symbol */}
            {data && !data.error && isConfigured && !inWatchlist && (
              <button
                onClick={() => addToWatchlist(symbol)}
                className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-medium rounded transition-colors"
              >
                <span>★</span>
                <span className="truncate">Add {symbol}</span>
              </button>
            )}
            <form onSubmit={(e) => { e.preventDefault(); addToWatchlist(addInput); }} className="flex gap-1">
              <input
                value={addInput}
                onChange={(e) => setAddInput(e.target.value.toUpperCase())}
                placeholder="Ticker…"
                maxLength={10}
                className="min-w-0 flex-1 bg-surface-raised border border-surface-border rounded px-2 py-1 text-xs text-fg placeholder-fg-4 focus:outline-none focus:border-accent uppercase"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-accent hover:bg-accent-hover text-fg text-xs font-medium rounded transition-colors flex-shrink-0"
              >
                +
              </button>
            </form>
          </div>
        </div>

        {/* ── Main panel ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0 p-5 flex flex-col gap-4">

          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                placeholder="Ticker…"
                maxLength={10}
                className="bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-sm text-fg placeholder-fg-4 focus:outline-none focus:border-accent w-28 uppercase"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-fg text-sm font-medium rounded-lg transition-colors"
              >
                Go
              </button>
            </form>

            {/* Star / watchlist toggle */}
            {data && !data.error && isConfigured && (
              <button
                onClick={() => inWatchlist ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
                title={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                className={`text-xl leading-none transition-colors ${inWatchlist ? "text-amber-400" : "text-fg-4 hover:text-amber-400"}`}
              >
                {inWatchlist ? "★" : "☆"}
              </button>
            )}

            <div className="flex-1" />

            {/* Range tabs */}
            <div className="flex gap-1 bg-surface border border-surface-border rounded-lg p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                    ${range === r ? "bg-accent/20 text-accent" : "text-fg-3 hover:text-fg-2"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Not configured */}
          {data && !isConfigured && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4 gap-2">
              <p className="text-fg font-medium">Finnhub API key not configured</p>
              <p className="text-sm text-fg-3">
                Add{" "}
                <code className="text-accent bg-surface px-1.5 py-0.5 rounded">FINNHUB_API_KEY</code>{" "}
                to your Vercel environment variables.
              </p>
              <a
                href="https://finnhub.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline"
              >
                Get a free API key at finnhub.io →
              </a>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && isConfigured && (
            <div className="animate-pulse space-y-3 flex-1">
              <div className="h-9 bg-surface rounded-lg w-48" />
              <div className="h-4 bg-surface rounded w-32" />
              <div className="h-36 bg-surface rounded-lg" />
            </div>
          )}

          {/* Error */}
          {!loading && data?.error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-fg-3">
              <span className="text-3xl">📈</span>
              <p className="text-sm">
                {data.error.includes("not found")
                  ? `"${symbol}" not found — check the ticker symbol`
                  : data.error}
              </p>
            </div>
          )}

          {/* Stock data */}
          {!loading && data && isConfigured && !data.error && (
            <>
              {/* Price header */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-bold text-fg tabular-nums">
                      ${data.price.toFixed(2)}
                    </span>
                    <span className={`text-base font-semibold tabular-nums ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {isPositive ? "+" : ""}{data.change.toFixed(2)}{" "}
                      <span className="text-sm">
                        ({isPositive ? "+" : ""}{data.changePercent.toFixed(2)}%)
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-fg-3 mt-0.5">{data.symbol} · {range} · 15-min delayed</p>
                </div>

                {/* OHLC stats */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-right flex-shrink-0">
                  {[
                    ["Open",       data.open.toFixed(2)],
                    ["Prev Close", data.prevClose.toFixed(2)],
                    ["Day High",   data.high.toFixed(2)],
                    ["Day Low",    data.low.toFixed(2)],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className="text-xs text-fg-3">{label} </span>
                      <span className="text-xs font-medium text-fg-2 tabular-nums">${val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <StockChart history={data.history} positive={isPositive} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
