"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
} from "@/app/finances/actions";

export type SerializedRecurringExpense = {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  isAutoPay: boolean;
  nextDueDate: string;
  notes: string | null;
  eventId: number | null;
};

const FREQUENCIES = [
  { value: "weekly",    label: "Weekly"    },
  { value: "monthly",   label: "Monthly"   },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly",    label: "Yearly"    },
];

const CATEGORIES = [
  { value: "housing",       label: "Housing",       color: "text-blue-400",    bg: "bg-blue-500/15"    },
  { value: "utilities",     label: "Utilities",     color: "text-cyan-400",    bg: "bg-cyan-500/15"    },
  { value: "subscriptions", label: "Subscriptions", color: "text-violet-400",  bg: "bg-violet-500/15"  },
  { value: "insurance",     label: "Insurance",     color: "text-emerald-400", bg: "bg-emerald-500/15" },
  { value: "loan",          label: "Loan / Debt",   color: "text-red-400",     bg: "bg-red-500/15"     },
  { value: "transport",     label: "Transport",     color: "text-amber-400",   bg: "bg-amber-500/15"   },
  { value: "health",        label: "Health",        color: "text-pink-400",    bg: "bg-pink-500/15"    },
  { value: "other",         label: "Other",         color: "text-fg-3",        bg: "bg-surface"        },
];

function getCat(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

// Monthly-equivalent cost for display
function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":    return (amount * 52) / 12;
    case "quarterly": return amount / 3;
    case "yearly":    return amount / 12;
    default:          return amount;
  }
}

function formatFreq(frequency: string): string {
  return FREQUENCIES.find((f) => f.value === frequency)?.label ?? frequency;
}

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ExpenseModal({
  expense,
  onClose,
}: {
  expense?: SerializedRecurringExpense | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEditing = !!expense;

  const [name, setName]           = useState(expense?.name ?? "");
  const [amount, setAmount]       = useState(expense?.amount.toString() ?? "");
  const [frequency, setFrequency] = useState(expense?.frequency ?? "monthly");
  const [category, setCategory]   = useState(expense?.category ?? "other");
  const [isAutoPay, setIsAutoPay] = useState(expense?.isAutoPay ?? false);
  const [nextDueDate, setNextDueDate] = useState(
    expense?.nextDueDate ? expense.nextDueDate.slice(0, 10) : ""
  );
  const [notes, setNotes]   = useState(expense?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount || !nextDueDate) return;
    setSaving(true);
    const data = {
      name: name.trim(),
      amount: parseFloat(amount),
      frequency,
      category,
      isAutoPay,
      nextDueDate,
      notes: notes.trim() || undefined,
    };
    if (isEditing) {
      await updateRecurringExpense(expense.id, data);
    } else {
      await createRecurringExpense(data);
    }
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!expense) return;
    setDeleting(true);
    await deleteRecurringExpense(expense.id);
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
          <h2 className="text-base font-semibold text-fg">
            {isEditing ? "Edit Recurring Expense" : "New Recurring Expense"}
          </h2>
          <button onClick={onClose} className="text-fg-3 hover:text-fg-2 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Name */}
          <input
            type="text"
            placeholder="Expense name (e.g. Netflix, Rent, Car loan)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent"
          />

          {/* Amount + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-fg-3 mb-1 block">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3 text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full bg-surface border border-surface-border rounded-lg pl-7 pr-3 py-2 text-fg text-sm focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-fg-3 mb-1 block">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-accent"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Next due date */}
          <div>
            <label className="text-xs text-fg-3 mb-1 block">Next due date</label>
            <input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              required
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-fg text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-fg-3 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                    ${category === cat.value
                      ? `${cat.bg} ${cat.color} border-current`
                      : "bg-surface border-surface-border text-fg-3 hover:border-gray-500"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-pay toggle */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div
              role="checkbox"
              aria-checked={isAutoPay}
              onClick={() => setIsAutoPay((v) => !v)}
              className={`mt-0.5 w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${isAutoPay ? "bg-accent" : "bg-surface-border"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAutoPay ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <div>
              <p className="text-sm text-fg-2 font-medium">Auto-pay</p>
              <p className="text-xs text-fg-3 mt-0.5">
                {isAutoPay
                  ? "Paid automatically — no action needed"
                  : "Requires manual action — a recurring event will be added to your schedule"}
              </p>
            </div>
          </label>

          {/* Notes */}
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-fg placeholder-fg-4 focus:outline-none focus:border-accent text-sm resize-none"
          />

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
              disabled={saving || !name.trim() || !amount || !nextDueDate}
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

// ── Main component ─────────────────────────────────────────────────────────────

export function RecurringExpenses({ expenses }: { expenses: SerializedRecurringExpense[] }) {
  const [modal, setModal] = useState<{ open: boolean; expense?: SerializedRecurringExpense | null }>({ open: false });

  const totalMonthly = expenses.reduce((sum, e) => sum + toMonthly(e.amount, e.frequency), 0);
  const autoCount   = expenses.filter((e) => e.isAutoPay).length;
  const manualCount = expenses.filter((e) => !e.isAutoPay).length;

  // Sort: manual first (requires action), then by next due date
  const sorted = [...expenses].sort((a, b) => {
    if (a.isAutoPay !== b.isAutoPay) return a.isAutoPay ? 1 : -1;
    return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
  });

  return (
    <>
      <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-fg">Recurring Expenses</h3>
            {expenses.length > 0 && (
              <p className="text-xs text-fg-3 mt-0.5">
                {formatCurrency(totalMonthly)}/mo · {autoCount} auto-pay · {manualCount} manual
              </p>
            )}
          </div>
          <button
            onClick={() => setModal({ open: true, expense: null })}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-2xl mb-2">💳</p>
            <p className="text-sm text-fg-2 font-medium">No recurring expenses yet</p>
            <p className="text-xs text-fg-3 mt-1 mb-4">Track subscriptions, rent, loans, and bills in one place.</p>
            <button
              onClick={() => setModal({ open: true, expense: null })}
              className="text-xs text-accent hover:underline"
            >
              Add your first expense →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-3 pb-1">
              <span className="text-xs text-fg-4 uppercase tracking-wide">Name</span>
              <span className="text-xs text-fg-4 uppercase tracking-wide text-right">Amount</span>
              <span className="text-xs text-fg-4 uppercase tracking-wide text-right hidden sm:block">Frequency</span>
              <span className="text-xs text-fg-4 uppercase tracking-wide text-right hidden sm:block">Next Due</span>
              <span className="text-xs text-fg-4 uppercase tracking-wide text-right">Payment</span>
            </div>

            {sorted.map((expense) => {
              const cat = getCat(expense.category);
              const monthly = toMonthly(expense.amount, expense.frequency);
              const isDueSoon = new Date(expense.nextDueDate) <= new Date(Date.now() + 7 * 86400000);

              return (
                <button
                  key={expense.id}
                  onClick={() => setModal({ open: true, expense })}
                  className="w-full grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                >
                  {/* Name + category */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cat.bg} ${cat.color}`}>
                      {cat.label}
                    </span>
                    <span className="text-sm font-medium text-fg truncate">{expense.name}</span>
                    {expense.notes && (
                      <span className="text-xs text-fg-4 truncate hidden lg:block">{expense.notes}</span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-fg tabular-nums">
                      ${expense.amount.toFixed(2)}
                    </p>
                    {expense.frequency !== "monthly" && (
                      <p className="text-xs text-fg-4 tabular-nums">{formatCurrency(monthly)}/mo</p>
                    )}
                  </div>

                  {/* Frequency */}
                  <span className="text-xs text-fg-3 hidden sm:block text-right">{formatFreq(expense.frequency)}</span>

                  {/* Next due */}
                  <span className={`text-xs hidden sm:block text-right tabular-nums ${isDueSoon && !expense.isAutoPay ? "text-amber-400 font-medium" : "text-fg-3"}`}>
                    {formatDate(expense.nextDueDate)}
                  </span>

                  {/* Auto / Manual badge */}
                  <div className="flex items-center gap-1 justify-end">
                    {expense.isAutoPay ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium flex-shrink-0">
                        Auto
                      </span>
                    ) : (
                      <a
                        href="/schedule"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium flex-shrink-0 hover:bg-amber-500/25 transition-colors"
                        title="View on schedule"
                      >
                        Manual →
                      </a>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Monthly total footer */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-surface-border px-3">
              <span className="text-xs text-fg-3">Estimated monthly total</span>
              <span className="text-sm font-bold text-fg tabular-nums">{formatCurrency(totalMonthly)}/mo</span>
            </div>
          </div>
        )}
      </div>

      {modal.open && (
        <ExpenseModal expense={modal.expense} onClose={() => setModal({ open: false })} />
      )}
    </>
  );
}
