"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SerializedSupplementEntry,
  SUPPLEMENT_UNITS,
  COMMON_SUPPLEMENTS,
  getTodaySupplements,
} from "@/lib/health";
import { logSupplement, deleteSupplement } from "@/app/health/actions";

type Props = {
  supplements: SerializedSupplementEntry[];
};

export function SupplementTracker({ supplements }: Props) {
  const router = useRouter();
  const todayEntries = getTodaySupplements(supplements);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("mg");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = name.length > 0
    ? COMMON_SUPPLEMENTS.filter((s) => s.toLowerCase().includes(name.toLowerCase()) && s.toLowerCase() !== name.toLowerCase())
    : [];

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await logSupplement({
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      unit,
      notes: notes.trim() || undefined,
    });
    setName("");
    setAmount("");
    setNotes("");
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: number) {
    await deleteSupplement(id);
    router.refresh();
  }

  function selectSuggestion(s: string) {
    setName(s);
    setShowSuggestions(false);
  }

  return (
    <div className="bg-surface-raised border border-pink-500/20 rounded-xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
          <span>💊</span> Supplements
        </span>
        <span className="text-xs text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">
          {todayEntries.length} today
        </span>
      </div>

      {/* Today's log */}
      {todayEntries.length > 0 && (
        <div className="space-y-1.5">
          {todayEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between group bg-surface rounded-lg px-3 py-2">
              <div>
                <span className="text-sm text-white font-medium">{entry.name}</span>
                {entry.amount > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    {entry.amount % 1 === 0 ? entry.amount.toFixed(0) : entry.amount}{entry.unit}
                  </span>
                )}
                {entry.notes && <span className="text-xs text-gray-600 ml-2">· {entry.notes}</span>}
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Remove"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {todayEntries.length === 0 && (
        <p className="text-xs text-gray-600 text-center py-1">Nothing logged today yet.</p>
      )}

      {/* Quick-add chips */}
      <div className="flex flex-wrap gap-1.5">
        {COMMON_SUPPLEMENTS.slice(0, 8).map((s) => {
          const alreadyTaken = todayEntries.some((e) => e.name.toLowerCase() === s.toLowerCase());
          return (
            <button
              key={s}
              type="button"
              onClick={() => setName(s)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors
                ${alreadyTaken
                  ? "bg-pink-500/10 border-pink-500/30 text-pink-400"
                  : "bg-surface border-surface-border text-gray-500 hover:border-gray-400 hover:text-gray-300"}`}
            >
              {alreadyTaken && <span className="mr-1">✓</span>}{s}
            </button>
          );
        })}
      </div>

      {/* Add form */}
      <form onSubmit={handleLog} className="space-y-2 border-t border-surface-border pt-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Supplement name…"
            value={name}
            onChange={(e) => { setName(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-raised border border-surface-border rounded-lg shadow-xl z-10 overflow-hidden">
              {suggestions.slice(0, 5).map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            step="any"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-24 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50"
          >
            {SUPPLEMENT_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "…" : "Log"}
          </button>
        </div>

        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
        />
      </form>
    </div>
  );
}
