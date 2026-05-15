"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCountdown, updateCountdown, deleteCountdown } from "@/app/countdowns/actions";

export type SerializedCountdown = {
  id: number;
  title: string;
  emoji: string;
  date: string; // ISO
};

function daysUntil(iso: string) {
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function CountdownModal({
  countdown,
  onClose,
}: {
  countdown?: SerializedCountdown | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditing = !!countdown;

  const [title,   setTitle]   = useState(countdown?.title ?? "");
  const [emoji,   setEmoji]   = useState(countdown?.emoji ?? "⏳");
  const [date,    setDate]    = useState(countdown?.date?.slice(0, 10) ?? "");
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    const data = { title: title.trim(), emoji: emoji.trim() || "⏳", date };
    if (isEditing) await updateCountdown(countdown.id, data);
    else           await createCountdown(data);
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!countdown) return;
    setDeleting(true);
    await deleteCountdown(countdown.id);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-surface-raised border border-surface-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-fg">{isEditing ? "Edit Countdown" : "Add Countdown"}</h2>
          <button onClick={onClose} className="text-fg-3 hover:text-fg-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="⏳"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-16 text-center bg-surface border border-surface-border rounded-lg px-2 py-2 text-fg placeholder-fg-4 focus:outline-none focus:border-accent"
            />
            <input
              type="text"
              placeholder="Event name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm"
            />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg focus:outline-none focus:border-accent text-sm"
          />
          <div className="flex items-center gap-2 pt-1">
            {isEditing && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50">
                {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-sm text-fg-2 hover:text-fg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !title.trim() || !date}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-fg transition-colors disabled:opacity-50">
              {saving ? "Saving…" : isEditing ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────────

export function CountdownWidget({ countdowns }: { countdowns: SerializedCountdown[] }) {
  const [modal, setModal] = useState<{ open: boolean; countdown?: SerializedCountdown | null }>({ open: false });

  const sorted = [...countdowns].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <>
      <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
            <span>⏳</span> Countdowns
          </h2>
          <button
            onClick={() => setModal({ open: true, countdown: null })}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-fg-3">No countdowns yet.</p>
            <button onClick={() => setModal({ open: true, countdown: null })}
              className="mt-2 text-xs text-accent hover:underline">
              Add your first →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {sorted.map((cd) => {
              const days = daysUntil(cd.date);
              const isPast = days < 0;
              const isToday = days === 0;
              const isSoon = days > 0 && days <= 7;
              return (
                <button
                  key={cd.id}
                  onClick={() => setModal({ open: true, countdown: cd })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all hover:scale-[1.02]
                    ${isPast ? "border-surface-border bg-surface opacity-50"
                    : isToday ? "border-accent/40 bg-accent/10"
                    : isSoon ? "border-amber-500/30 bg-amber-500/10"
                    : "border-surface-border bg-surface"}`}
                >
                  <span className="text-xl">{cd.emoji}</span>
                  <span className={`text-2xl font-bold leading-none ${
                    isPast ? "text-fg-3" : isToday ? "text-accent" : isSoon ? "text-amber-400" : "text-fg"
                  }`}>
                    {isPast ? `+${Math.abs(days)}` : days}
                  </span>
                  <span className="text-[10px] text-fg-3 leading-none">
                    {isPast ? "days ago" : isToday ? "TODAY" : "days"}
                  </span>
                  <span className="text-xs text-fg-2 leading-tight mt-0.5 line-clamp-1">{cd.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {modal.open && (
        <CountdownModal countdown={modal.countdown} onClose={() => setModal({ open: false })} />
      )}
    </>
  );
}
