"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SerializedGoal } from "@/lib/finance";
import { createGoal, updateGoal, deleteGoal } from "@/app/finances/actions";

const EMOJI_OPTIONS = ["🎯", "🏠", "🚗", "✈️", "🎓", "💍", "🛡️", "📈", "🏖️", "💻", "🎁", "🐾"];

type Props = {
  goal?: SerializedGoal | null;
  onClose: () => void;
};

export function GoalModal({ goal, onClose }: Props) {
  const router = useRouter();
  const isEditing = !!goal;

  const [name, setName] = useState(goal?.name ?? "");
  const [emoji, setEmoji] = useState(goal?.emoji ?? "🎯");
  const [target, setTarget] = useState(goal?.targetAmount?.toString() ?? "");
  const [current, setCurrent] = useState(goal?.currentAmount?.toString() ?? "0");
  const [targetDate, setTargetDate] = useState(
    goal?.targetDate ? goal.targetDate.substring(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !target) return;
    setSaving(true);
    const data = {
      name: name.trim(),
      emoji,
      targetAmount: parseFloat(target) || 0,
      currentAmount: parseFloat(current) || 0,
      targetDate: targetDate || undefined,
    };
    if (isEditing) {
      await updateGoal(goal.id, data);
    } else {
      await createGoal(data);
    }
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!goal) return;
    setDeleting(true);
    await deleteGoal(goal.id);
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
          <h2 className="text-base font-semibold text-fg">
            {isEditing ? "Edit Goal" : "New Goal"}
          </h2>
          <button onClick={onClose} className="text-fg-3 hover:text-fg-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs text-fg-3 mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all
                    ${emoji === e ? "border-accent bg-accent/10" : "border-surface-border bg-surface hover:border-gray-500"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-fg-3 mb-1 block">Goal Name</label>
            <input
              type="text"
              placeholder='e.g. "Emergency Fund"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fg-3 mb-1 block">Target Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-2 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="10,000"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                  className="w-full bg-surface border border-surface-border rounded-lg pl-7 pr-3 py-2 text-fg text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-fg-3 mb-1 block">Saved So Far</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-2 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className="w-full bg-surface border border-surface-border rounded-lg pl-7 pr-3 py-2 text-fg text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Target date */}
          <div>
            <label className="text-xs text-fg-3 mb-1 block">Target Date (optional)</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {/* Actions */}
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
              disabled={saving || !name.trim() || !target}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-fg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Update" : "Add Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
