"use client";

import { useState, useEffect, useCallback } from "react";
import type { NewsArticle } from "@/app/api/news/route";

const CATEGORIES = [
  { id: "top",        label: "Top Stories" },
  { id: "politics",   label: "Politics" },
  { id: "business",   label: "Business" },
  { id: "technology", label: "Technology" },
  { id: "culture",    label: "Culture" },
  { id: "sport",      label: "Sport" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function NewsView() {
  const [category, setCategory] = useState("top");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (cat: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?category=${cat}`);
      const data = await res.json();
      setConfigured(data.configured);
      setArticles(data.articles ?? []);
      if (data.error) setError(data.error);
    } catch {
      setError("Failed to load news");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(category);
  }, [category, fetchNews]);

  const [featured, ...rest] = articles;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-fg">News</h1>
          <p className="text-sm text-fg-2 mt-0.5">Top stories from The Guardian.</p>
        </div>
        <button
          onClick={() => fetchNews(category)}
          className="flex items-center gap-1.5 text-xs text-fg-3 hover:text-fg-2 transition-colors px-3 py-1.5 bg-surface-raised border border-surface-border rounded-lg"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === cat.id
                ? "bg-accent/10 text-accent border border-accent/20"
                : "text-fg-3 hover:text-fg-2 hover:bg-white/5"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Not configured */}
      {!configured && (
        <div className="bg-surface-raised border border-surface-border rounded-xl p-8 text-center">
          <p className="text-2xl mb-3">📰</p>
          <p className="text-fg font-medium mb-2">Guardian API key not configured</p>
          <p className="text-sm text-fg-3 mb-4">
            Add <code className="text-accent bg-surface px-1.5 py-0.5 rounded">GUARDIAN_API_KEY</code> to your Vercel environment variables.
          </p>
          <a
            href="https://open-platform.theguardian.com/access/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            Get a free API key →
          </a>
        </div>
      )}

      {/* Error */}
      {configured && error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && configured && (
        <div className="space-y-3 animate-pulse">
          <div className="bg-surface-raised rounded-xl h-48" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-raised rounded-xl h-20" />
          ))}
        </div>
      )}

      {/* Articles */}
      {!loading && configured && !error && articles.length > 0 && (
        <div className="space-y-3">
          {/* Featured article */}
          {featured && (
            <a
              href={featured.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group bg-surface-raised border border-surface-border rounded-xl overflow-hidden hover:border-accent/30 transition-colors"
            >
              {featured.thumbnail && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img
                    src={featured.thumbnail}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs bg-accent/80 text-fg px-2 py-0.5 rounded-full font-medium">
                    {featured.section}
                  </span>
                </div>
              )}
              <div className="p-4">
                <h2 className="text-fg font-semibold text-base leading-snug group-hover:text-accent transition-colors mb-2">
                  {featured.title}
                </h2>
                {featured.trailText && (
                  <p className="text-sm text-fg-2 line-clamp-2 leading-relaxed mb-3">
                    {stripHtml(featured.trailText)}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-fg-3">
                  {featured.byline && <span>{featured.byline}</span>}
                  <span>{timeAgo(featured.publishedAt)}</span>
                </div>
              </div>
            </a>
          )}

          {/* Article list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rest.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 bg-surface-raised border border-surface-border rounded-xl p-4 hover:border-accent/30 transition-colors"
              >
                {article.thumbnail && (
                  <img
                    src={article.thumbnail}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs text-accent font-medium">{article.section}</span>
                    <span className="text-xs text-fg-4">·</span>
                    <span className="text-xs text-fg-3">{timeAgo(article.publishedAt)}</span>
                  </div>
                  <h3 className="text-sm font-medium text-fg group-hover:text-fg transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  {article.byline && (
                    <p className="text-xs text-fg-3 mt-1 truncate">{article.byline}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {!loading && configured && !error && articles.length === 0 && (
        <div className="text-center py-12 text-fg-3">No articles found.</div>
      )}
    </div>
  );
}
