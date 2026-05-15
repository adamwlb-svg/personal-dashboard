"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/app/api/search/route";

const TYPE_META: Record<SearchResult["type"], { label: string; icon: string }> = {
  event:   { label: "Events",   icon: "📅" },
  task:    { label: "Tasks",    icon: "✅" },
  contact: { label: "Contacts", icon: "📇" },
  link:    { label: "Links",    icon: "🔗" },
};

export function GlobalSearch() {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active,  setActive]  = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open on ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30);
      setQuery("");
      setResults([]);
      setActive(0);
    }
  }, [open]);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setActive(0);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    search(e.target.value);
  }

  function navigate(result: SearchResult) {
    setOpen(false);
    if (result.newTab) {
      window.open(result.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(result.href);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter" && results[active]) navigate(results[active]);
  }

  // Group results by type
  const grouped = (["event", "task", "contact", "link"] as SearchResult["type"][])
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length > 0);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onMouseDown={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-surface-raised border border-surface-border rounded-2xl shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border">
          <svg className="w-4 h-4 text-fg-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search events, tasks, contacts, links…"
            className="flex-1 bg-transparent text-fg placeholder-fg-4 focus:outline-none text-sm"
          />
          {loading && (
            <svg className="w-4 h-4 text-fg-3 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-fg-3 bg-surface border border-surface-border rounded px-1.5 py-0.5 flex-shrink-0">
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {grouped.map((group) => {
              const meta = TYPE_META[group.type];
              return (
                <div key={group.type}>
                  <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-fg-3">
                    {meta.icon} {meta.label}
                  </p>
                  {group.items.map((result) => {
                    const idx = results.indexOf(result);
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => navigate(result)}
                        onMouseEnter={() => setActive(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                          ${idx === active ? "bg-accent/10" : "hover:bg-white/[0.03]"}`}
                      >
                        <span className="text-base flex-shrink-0 w-5 text-center">
                          {result.emoji ?? meta.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-fg truncate">{result.title}</p>
                          <p className="text-xs text-fg-3 truncate">{result.subtitle}</p>
                        </div>
                        {result.newTab && (
                          <svg className="w-3.5 h-3.5 text-fg-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : query.length >= 2 && !loading ? (
          <div className="py-10 text-center text-sm text-fg-3">No results for &ldquo;{query}&rdquo;</div>
        ) : query.length === 0 ? (
          <div className="py-8 text-center text-xs text-fg-3">
            Search across events, tasks, contacts, and quick links
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-surface-border text-[10px] text-fg-3">
          <span>↑↓ navigate · Enter open · Esc close</span>
          <span>⌘K to toggle</span>
        </div>
      </div>
    </div>
  );
}
