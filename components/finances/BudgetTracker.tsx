"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/finance";
import {
  createBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory,
  createBudgetEntry,
  deleteBudgetEntry,
} from "@/app/finances/budget-actions";

export type SerializedBudgetCategory = {
  id: number;
  name: string;
  emoji: string;
  amount: number;
  color: string;
};

export type SerializedBudgetEntry = {
  id: number;
  categoryId: number;
  amount: number;
  description: string | null;
  date: string;
};

const COLORS = [
  { value: "blue",    bar: "bg-blue-400",    text: "text-blue-400",    border: "border-blue-500/30",    bg: "bg-blue-500/10" },
  { value: "emerald", bar: "bg-emerald-400", text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  { value: "violet",  bar: "bg-violet-400",  text: "text-violet-400",  border: "border-violet-500/30",  bg: "bg-violet-500/10" },
  { value: "amber",   bar: "bg-amber-400",   text: "text-amber-400",   border: "border-amber-500/30",   bg: "bg-amber-500/10" },
  { value: "rose",    bar: "bg-rose-400",    text: "text-rose-400",    border: "border-rose-500/30",    bg: "bg-rose-500/10" },
  { value: "teal",    bar: "bg-teal-400",    text: "text-teal-400",    border: "border-teal-500/30",    bg: "bg-teal-500/10" },
  { value: "orange",  bar: "bg-orange-400",  text: "text-orange-400",  border: "border-orange-500/30",  bg: "bg-orange-500/10" },
  { value: "pink",    bar: "bg-pink-400",    text: "text-pink-400",    border: "border-pink-500/30",    bg: "bg-pink-500/10" },
];

function getColor(value: string) {
  return COLORS.find((c) => c.value === value) ?? COLORS[0];
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ── Category Modal ─────────────────────────────────────────────────────────────

function CategoryModal({ cat, onClose }: { cat?: SerializedBudgetCategory | null; onClose: () => void }) {
  const router = useRouter();
  const isEditing = !!cat;
  const [name,    setName]    = useState(cat?.name    ?? "");
  const [emoji,   setEmoji]   = useState(cat?.emoji   ?? "");
  const [amount,  setAmount]  = useState(cat?.amount?.toString() ?? "");
  const [color,   setColor]   = useState(cat?.color   ?? "blue");
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    setSaving(true);
    const data = { name: name.trim(), emoji: emoji.trim() || "💰", amount: parseFloat(amount), color };
    if (isEditing) await updateBudgetCategory(cat.id, data);
    else           await createBudgetCategory(data);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!cat) return;
    setDeleting(true);
    await deleteBudgetCategory(cat.id);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-surface-raised border border-surface-border rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-fg">{isEditing ? "Edit Category" : "Add Budget Category"}</h2>
          <button onClick={onClose} className="text-fg-3 hover:text-fg-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="flex gap-2">
            <input type="text" placeholder="💰" value={emoji} onChange={(e) => setEmoji(e.target.value)}
              className="w-14 text-center bg-surface border border-surface-border rounded-lg px-2 py-2 text-fg focus:outline-none focus:border-accent" />
            <input type="text" placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus
              className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm" />
          </div>
          <div>
            <label className="text-xs text-fg-3 mb-1 block">Monthly Budget</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 text-sm">$</span>
              <input type="number" min="0" step="1" placeholder="500" value={amount} onChange={(e) => setAmount(e.target.value)} required
                className="w-full bg-surface border border-surface-border rounded-lg pl-7 pr-3 py-2 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-fg-3 mb-1.5 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  className={`w-6 h-6 rounded-full ${c.bar} transition-all ${color === c.value ? "ring-2 ring-offset-2 ring-offset-surface-raised ring-white/50 scale-110" : "opacity-60 hover:opacity-100"}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {isEditing && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-fg-2 hover:text-fg transition-colors">Cancel</button>
            <button type="submit" disabled={saving || !name.trim() || !amount}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-fg transition-colors disabled:opacity-50">
              {saving ? "Saving…" : isEditing ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Entry Modal ────────────────────────────────────────────────────────────────

function EntryModal({
  categories,
  defaultCategoryId,
  onClose,
}: {
  categories: SerializedBudgetCategory[];
  defaultCategoryId?: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [categoryId,   setCategoryId]  = useState(defaultCategoryId ?? categories[0]?.id ?? 0);
  const [amount,       setAmount]      = useState("");
  const [description,  setDescription] = useState("");
  const [date,         setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [saving,       setSaving]      = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !categoryId) return;
    setSaving(true);
    await createBudgetEntry({
      categoryId,
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      date,
    });
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-surface-raised border border-surface-border rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-fg">Log Expense</h2>
          <button onClick={onClose} className="text-fg-3 hover:text-fg-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs text-fg-3 mb-1 block">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-accent">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-fg-3 mb-1 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 text-sm">$</span>
              <input type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus
                className="w-full bg-surface border border-surface-border rounded-lg pl-7 pr-3 py-2 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm" />
            </div>
          </div>
          <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg focus:outline-none focus:border-accent text-sm" />
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm text-fg-2 hover:text-fg transition-colors">Cancel</button>
            <button type="submit" disabled={saving || !amount || !categoryId}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-fg transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function BudgetTracker({
  categories,
  entries,
}: {
  categories: SerializedBudgetCategory[];
  entries: SerializedBudgetEntry[];
}) {
  const router = useRouter();
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [catModal,   setCatModal]   = useState<{ open: boolean; cat?: SerializedBudgetCategory | null }>({ open: false });
  const [entryModal, setEntryModal] = useState<{ open: boolean; categoryId?: number }>({ open: false });
  const [expanded,   setExpanded]   = useState<number | null>(null);

  function navMonth(dir: number) {
    const d = new Date(year, month + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const monthEntries = useMemo(() =>
    entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }),
    [entries, year, month]
  );

  const totalBudgeted = categories.reduce((s, c) => s + c.amount, 0);
  const totalSpent    = monthEntries.reduce((s, e) => s + e.amount, 0);
  const overallPct    = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0;
  const isOver        = totalSpent > totalBudgeted;

  async function handleDeleteEntry(id: number) {
    await deleteBudgetEntry(id);
    router.refresh();
  }

  return (
    <>
      <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            <span>📊</span> Monthly Budget
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setEntryModal({ open: true })} disabled={categories.length === 0}
              className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-40 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Log Expense
            </button>
            <span className="text-fg-4">·</span>
            <button onClick={() => setCatModal({ open: true, cat: null })}
              className="text-xs text-fg-3 hover:text-fg-2 transition-colors">
              + Category
            </button>
          </div>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navMonth(-1)} className="p-1 rounded-lg text-fg-3 hover:text-fg hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-fg">{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => navMonth(1)} className="p-1 rounded-lg text-fg-3 hover:text-fg hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-fg-2 font-medium">No budget categories yet</p>
            <p className="text-xs text-fg-3 mt-1 mb-4">Create categories like Dining, Groceries, or Entertainment.</p>
            <button onClick={() => setCatModal({ open: true, cat: null })} className="text-xs text-accent hover:underline">
              Add your first category →
            </button>
          </div>
        ) : (
          <>
            {/* Overall summary */}
            <div className="mb-4 p-3 bg-surface rounded-xl border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-fg-3">Total spending</span>
                <span className={`text-xs font-semibold ${isOver ? "text-red-400" : "text-fg-2"}`}>
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
                </span>
              </div>
              <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : "bg-accent"}`}
                  style={{ width: `${overallPct}%` }}
                />
              </div>
              <p className="text-xs text-fg-3 mt-1.5">
                {isOver
                  ? `${formatCurrency(totalSpent - totalBudgeted)} over budget`
                  : `${formatCurrency(totalBudgeted - totalSpent)} remaining`}
              </p>
            </div>

            {/* Per-category rows */}
            <div className="space-y-2">
              {categories.map((cat) => {
                const col   = getColor(cat.color);
                const spent = monthEntries.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
                const pct   = cat.amount > 0 ? Math.min((spent / cat.amount) * 100, 100) : 0;
                const over  = spent > cat.amount;
                const catEntries = monthEntries.filter((e) => e.categoryId === cat.id);
                const isOpen = expanded === cat.id;

                return (
                  <div key={cat.id} className={`rounded-xl border overflow-hidden ${col.border} ${col.bg}`}>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => setExpanded(isOpen ? null : cat.id)}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          <span className="text-base">{cat.emoji}</span>
                          <span className="text-sm font-medium text-fg">{cat.name}</span>
                          {catEntries.length > 0 && (
                            <span className="text-xs text-fg-3">({catEntries.length})</span>
                          )}
                        </button>
                        <button onClick={() => setEntryModal({ open: true, categoryId: cat.id })}
                          className="text-xs text-fg-3 hover:text-fg-2 transition-colors flex-shrink-0">
                          + Log
                        </button>
                        <button onClick={() => setCatModal({ open: true, cat })}
                          className="text-fg-3 hover:text-fg-2 transition-colors flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </div>
                      <div className="h-1.5 bg-surface/50 rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${over ? "bg-red-400" : col.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${over ? "text-red-400" : col.text}`}>
                          {formatCurrency(spent)}
                        </span>
                        <span className="text-xs text-fg-3">of {formatCurrency(cat.amount)}</span>
                      </div>
                    </div>

                    {/* Expanded entries */}
                    {isOpen && catEntries.length > 0 && (
                      <div className="border-t border-surface/30 px-3 py-2 space-y-1">
                        {catEntries
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry) => (
                            <div key={entry.id} className="flex items-center gap-2 text-xs text-fg-2">
                              <span className="text-fg-3 flex-shrink-0">
                                {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                              <span className="flex-1 truncate">{entry.description ?? "—"}</span>
                              <span className="font-medium flex-shrink-0">{formatCurrency(entry.amount)}</span>
                              <button onClick={() => handleDeleteEntry(entry.id)}
                                className="text-fg-3 hover:text-red-400 transition-colors flex-shrink-0">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {catModal.open && (
        <CategoryModal cat={catModal.cat} onClose={() => setCatModal({ open: false })} />
      )}
      {entryModal.open && categories.length > 0 && (
        <EntryModal
          categories={categories}
          defaultCategoryId={entryModal.categoryId}
          onClose={() => setEntryModal({ open: false })}
        />
      )}
    </>
  );
}
