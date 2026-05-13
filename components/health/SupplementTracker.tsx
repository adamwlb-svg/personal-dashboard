"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SerializedSupplementEntry,
  SerializedDailySupplement,
  SUPPLEMENT_UNITS,
  COMMON_SUPPLEMENTS,
  getTodaySupplements,
} from "@/lib/health";
import {
  logSupplement,
  deleteSupplement,
  createDailySupplement,
  updateDailySupplement,
  deleteDailySupplement,
} from "@/app/health/actions";

type Props = {
  supplements: SerializedSupplementEntry[];
  dailyStack: SerializedDailySupplement[];
};

export function SupplementTracker({ supplements, dailyStack }: Props) {
  const router = useRouter();
  const todayEntries = getTodaySupplements(supplements);
  const [tab, setTab] = useState<"today" | "stack">("today");

  async function handleLogOne(s: SerializedDailySupplement) {
    await logSupplement({ name: s.name, amount: s.amount, unit: s.unit });
    router.refresh();
  }

  async function handleUnlog(entryId: number) {
    await deleteSupplement(entryId);
    router.refresh();
  }

  return (
    <div className="bg-surface-raised border border-pink-500/20 rounded-xl flex flex-col">
      {/* Header + tabs */}
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <span className="text-sm font-medium text-fg-2 flex items-center gap-1.5">
          <span>💊</span> Supplements
        </span>
        <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5">
          {(["today", "stack"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors
                ${tab === t ? "bg-surface-raised text-fg" : "text-fg-3 hover:text-fg-2"}`}
            >
              {t === "today" ? "Today" : "Daily Stack"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {tab === "today" ? (
          <TodayTab
            todayEntries={todayEntries}
            dailyStack={dailyStack}
            onLogOne={handleLogOne}
            onUnlog={handleUnlog}
            supplements={supplements}
          />
        ) : (
          <StackTab dailyStack={dailyStack} />
        )}
      </div>
    </div>
  );
}

// ── Today tab ─────────────────────────────────────────────────────────────────

function TodayTab({
  todayEntries,
  dailyStack,
  onLogOne,
  onUnlog,
  supplements,
}: {
  todayEntries: SerializedSupplementEntry[];
  dailyStack: SerializedDailySupplement[];
  onLogOne: (s: SerializedDailySupplement) => void;
  onUnlog: (id: number) => void;
  supplements: SerializedSupplementEntry[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("mg");
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = name.length > 0
    ? COMMON_SUPPLEMENTS.filter(
        (s) => s.toLowerCase().includes(name.toLowerCase()) && s.toLowerCase() !== name.toLowerCase()
      )
    : [];

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await logSupplement({ name: name.trim(), amount: parseFloat(amount) || 0, unit });
    setName(""); setAmount(""); setSaving(false);
    router.refresh();
  }

  // Daily stack quick-log row
  const activeDailyStack = dailyStack.filter((s) => s.isActive);

  return (
    <>
      {/* Daily stack quick-log */}
      {activeDailyStack.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-fg-3">Daily stack</p>
            <span className="text-xs text-fg-3 italic">auto-logged · uncheck to skip</span>
          </div>
          <div className="space-y-1">
            {activeDailyStack.map((s) => {
              const todayEntry = todayEntries.find(
                (e) => e.name.toLowerCase() === s.name.toLowerCase()
              );
              return (
                <div key={s.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => todayEntry ? onUnlog(todayEntry.id) : onLogOne(s)}
                    className={`flex-shrink-0 w-4 h-4 rounded border transition-colors
                      ${todayEntry ? "bg-pink-500 border-pink-500" : "border-surface-border hover:border-pink-400"}`}
                  >
                    {todayEntry && (
                      <svg className="w-4 h-4 text-fg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${todayEntry ? "text-fg-2 line-through" : "text-fg"}`}>
                    {s.name}
                  </span>
                  {s.amount > 0 && (
                    <span className="text-xs text-fg-3">
                      {s.amount % 1 === 0 ? s.amount.toFixed(0) : s.amount}{s.unit}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeDailyStack.length === 0 && todayEntries.length === 0 && (
        <p className="text-xs text-fg-3 text-center py-2">
          Set up your Daily Stack — it will be logged automatically each day.
        </p>
      )}

      {/* Extra entries logged today (not from daily stack) */}
      {todayEntries.filter((e) => !dailyStack.some((s) => s.name.toLowerCase() === e.name.toLowerCase())).length > 0 && (
        <div className="space-y-1 pt-1 border-t border-surface-border">
          <p className="text-xs text-fg-3">Other today</p>
          {todayEntries
            .filter((e) => !dailyStack.some((s) => s.name.toLowerCase() === e.name.toLowerCase()))
            .map((e) => (
              <div key={e.id} className="flex items-center gap-2 group">
                <span className="text-sm text-fg-2 flex-1">{e.name}</span>
                {e.amount > 0 && (
                  <span className="text-xs text-fg-3">{e.amount % 1 === 0 ? e.amount.toFixed(0) : e.amount}{e.unit}</span>
                )}
                <button onClick={() => onUnlog(e.id)} className="text-fg-4 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
        </div>
      )}

      {/* One-off add form */}
      <form onSubmit={handleLog} className="border-t border-surface-border pt-3 space-y-2">
        <p className="text-xs text-fg-3">Log a one-off supplement</p>
        <div className="relative">
          <input
            type="text"
            placeholder="Supplement name…"
            value={name}
            onChange={(e) => { setName(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-fg placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-raised border border-surface-border rounded-lg shadow-xl z-10 overflow-hidden">
              {suggestions.slice(0, 5).map((s) => (
                <button key={s} type="button" onMouseDown={() => { setName(s); setShowSuggestions(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-fg-2 hover:bg-surface hover:text-fg transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input type="number" step="any" min="0" placeholder="Amount" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-20 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-fg placeholder-gray-500 focus:outline-none focus:border-pink-500/50" />
          <select value={unit} onChange={(e) => setUnit(e.target.value)}
            className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-pink-500/50">
            {SUPPLEMENT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <button type="submit" disabled={saving || !name.trim()}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-fg text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {saving ? "…" : "Log"}
          </button>
        </div>
      </form>
    </>
  );
}

// ── Daily Stack management tab ────────────────────────────────────────────────

function StackTab({ dailyStack }: { dailyStack: SerializedDailySupplement[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("mg");
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = name.length > 0
    ? COMMON_SUPPLEMENTS.filter(
        (s) => s.toLowerCase().includes(name.toLowerCase()) && s.toLowerCase() !== name.toLowerCase()
      )
    : [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await createDailySupplement({ name: name.trim(), amount: parseFloat(amount) || 0, unit });
    setName(""); setAmount(""); setSaving(false);
    router.refresh();
  }

  async function handleToggleActive(s: SerializedDailySupplement) {
    await updateDailySupplement(s.id, { name: s.name, amount: s.amount, unit: s.unit, isActive: !s.isActive });
    router.refresh();
  }

  async function handleDelete(id: number) {
    await deleteDailySupplement(id);
    router.refresh();
  }

  return (
    <>
      <p className="text-xs text-fg-3 leading-relaxed">
        Active supplements are automatically logged each day when you open Health. Uncheck anything on the Today tab if you skipped it.
      </p>

      {dailyStack.length === 0 && (
        <p className="text-xs text-fg-3 text-center py-2">No daily supplements yet. Add your first below.</p>
      )}

      <div className="space-y-1.5">
        {dailyStack.map((s) => (
          <div key={s.id} className="flex items-center gap-2 group bg-surface rounded-lg px-3 py-2">
            <button
              onClick={() => handleToggleActive(s)}
              className={`flex-shrink-0 w-4 h-4 rounded border transition-colors
                ${s.isActive ? "bg-pink-500 border-pink-500" : "border-surface-border"}`}
            >
              {s.isActive && (
                <svg className="w-4 h-4 text-fg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`text-sm flex-1 ${s.isActive ? "text-fg" : "text-fg-3"}`}>{s.name}</span>
            {s.amount > 0 && (
              <span className="text-xs text-fg-3">{s.amount % 1 === 0 ? s.amount.toFixed(0) : s.amount}{s.unit}</span>
            )}
            <button onClick={() => handleDelete(s.id)}
              className="text-fg-4 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ml-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add to stack form */}
      <form onSubmit={handleAdd} className="border-t border-surface-border pt-3 space-y-2">
        <div className="relative">
          <input type="text" placeholder="Add supplement to daily stack…" value={name}
            onChange={(e) => { setName(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-fg placeholder-gray-500 focus:outline-none focus:border-pink-500/50" />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-raised border border-surface-border rounded-lg shadow-xl z-10 overflow-hidden">
              {suggestions.slice(0, 5).map((s) => (
                <button key={s} type="button" onMouseDown={() => { setName(s); setShowSuggestions(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-fg-2 hover:bg-surface hover:text-fg transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input type="number" step="any" min="0" placeholder="Amount" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-20 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-fg placeholder-gray-500 focus:outline-none focus:border-pink-500/50" />
          <select value={unit} onChange={(e) => setUnit(e.target.value)}
            className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-pink-500/50">
            {SUPPLEMENT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <button type="submit" disabled={saving || !name.trim()}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-fg text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            {saving ? "…" : "Add"}
          </button>
        </div>
      </form>
    </>
  );
}
