"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuickLink, updateQuickLink, deleteQuickLink } from "@/app/links/actions";

export type SerializedQuickLink = {
  id: number;
  title: string;
  url: string;
  category: string;
  emoji: string | null;
  sortOrder: number;
};

const CATEGORIES = [
  { value: "work",          label: "Work",          color: "bg-blue-400",    pill: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
  { value: "finance",       label: "Finance",       color: "bg-emerald-400", pill: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  { value: "health",        label: "Health",        color: "bg-teal-400",    pill: "bg-teal-500/10 border-teal-500/20 text-teal-400" },
  { value: "personal",      label: "Personal",      color: "bg-violet-400",  pill: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
  { value: "social",        label: "Social",        color: "bg-pink-400",    pill: "bg-pink-500/10 border-pink-500/20 text-pink-400" },
  { value: "shopping",      label: "Shopping",      color: "bg-amber-400",   pill: "bg-amber-500/10 border-amber-500/20 text-amber-400" },
  { value: "news",          label: "News",          color: "bg-orange-400",  pill: "bg-orange-500/10 border-orange-500/20 text-orange-400" },
  { value: "entertainment", label: "Entertainment", color: "bg-rose-400",    pill: "bg-rose-500/10 border-rose-500/20 text-rose-400" },
  { value: "other",         label: "Other",         color: "bg-slate-400",   pill: "bg-slate-500/10 border-slate-500/20 text-slate-400" },
];

function getCategoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function FaviconImg({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  const domain = getDomain(url);
  if (failed) return <span className="text-lg">🔗</span>;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      width={20}
      height={20}
      className="w-5 h-5 rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function LinkModal({
  link,
  defaultCategory,
  onClose,
}: {
  link?: SerializedQuickLink | null;
  defaultCategory?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditing = !!link;

  const [title,    setTitle]    = useState(link?.title    ?? "");
  const [url,      setUrl]      = useState(link?.url      ?? "");
  const [category, setCategory] = useState(link?.category ?? defaultCategory ?? "personal");
  const [emoji,    setEmoji]    = useState(link?.emoji    ?? "");
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    setSaving(true);
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = `https://${normalizedUrl}`;
    const data = {
      title: title.trim(),
      url: normalizedUrl,
      category,
      emoji: emoji.trim() || undefined,
    };
    if (isEditing) await updateQuickLink(link.id, data);
    else           await createQuickLink(data);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!link) return;
    setDeleting(true);
    await deleteQuickLink(link.id);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-surface-raised border border-surface-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-fg">{isEditing ? "Edit Link" : "Add Link"}</h2>
          <button onClick={onClose} className="text-fg-3 hover:text-fg-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title + Emoji */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Emoji (optional)"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-20 text-center bg-surface border border-surface-border rounded-lg px-2 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              placeholder="Site name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="flex-1 bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent"
            />
          </div>

          {/* URL */}
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm"
          />

          {/* Category */}
          <div>
            <label className="text-xs text-fg-3 mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                    ${category === c.value
                      ? "bg-accent/15 text-accent border-accent/40"
                      : "bg-surface border-surface-border text-fg-3 hover:border-gray-500"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-fg-2 hover:text-fg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim() || !url.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-fg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Link Card ──────────────────────────────────────────────────────────────────

function LinkCard({ link, onEdit }: { link: SerializedQuickLink; onEdit: () => void }) {
  return (
    <div className="group relative bg-surface border border-surface-border rounded-xl p-3.5 hover:border-gray-600 transition-colors flex items-center gap-3">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className="w-8 h-8 rounded-lg bg-surface-raised border border-surface-border flex items-center justify-center flex-shrink-0">
          {link.emoji ? (
            <span className="text-base">{link.emoji}</span>
          ) : (
            <FaviconImg url={link.url} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg truncate leading-tight">{link.title}</p>
          <p className="text-xs text-fg-3 truncate">{getDomain(link.url)}</p>
        </div>
      </a>
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-fg-3 hover:text-fg-2 flex-shrink-0"
        aria-label="Edit link"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  );
}

// ── Section Divider ────────────────────────────────────────────────────────────

function SectionDivider({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-1 h-4 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-3 flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

export function QuickLinksView({ links }: { links: SerializedQuickLink[] }) {
  const [modal, setModal] = useState<{
    open: boolean;
    link?: SerializedQuickLink | null;
    defaultCategory?: string;
  }>({ open: false });

  // Group by category, preserving CATEGORIES display order
  const grouped = CATEGORIES
    .map((cat) => ({
      ...cat,
      links: links.filter((l) => l.category === cat.value),
    }))
    .filter((cat) => cat.links.length > 0);

  const uncategorized = links.filter(
    (l) => !CATEGORIES.find((c) => c.value === l.category)
  );

  return (
    <>
      <div className="space-y-10">
        {/* Page title */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-fg">Quick Links</h1>
            <p className="text-sm text-fg-2 mt-0.5">Your most-visited sites, organized by category.</p>
          </div>
          <button
            onClick={() => setModal({ open: true, link: null })}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-fg text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Link
          </button>
        </div>

        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-4xl mb-3">🔗</p>
            <p className="text-base font-medium text-fg-2">No links yet</p>
            <p className="text-sm text-fg-3 mt-1 mb-6 max-w-xs">
              Save your most-visited sites here — grouped by category for quick access.
            </p>
            <button
              onClick={() => setModal({ open: true, link: null })}
              className="text-sm text-accent hover:underline"
            >
              Add your first link →
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((cat) => (
              <section key={cat.value} className="space-y-3">
                <div className="flex items-center justify-between">
                  <SectionDivider label={cat.label} color={cat.color} />
                  <button
                    onClick={() => setModal({ open: true, link: null, defaultCategory: cat.value })}
                    className="ml-4 text-xs text-fg-3 hover:text-accent transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {cat.links.map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      onEdit={() => setModal({ open: true, link })}
                    />
                  ))}
                </div>
              </section>
            ))}

            {uncategorized.length > 0 && (
              <section className="space-y-3">
                <SectionDivider label="Other" color="bg-slate-400" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {uncategorized.map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      onEdit={() => setModal({ open: true, link })}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {modal.open && (
        <LinkModal
          link={modal.link}
          defaultCategory={modal.defaultCategory}
          onClose={() => setModal({ open: false })}
        />
      )}
    </>
  );
}
