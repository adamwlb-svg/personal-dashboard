"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACCOUNT_TYPES, AccountType, SerializedAccount, formatCurrency } from "@/lib/finance";
import { createAccount, updateAccount, deleteAccount } from "@/app/finances/actions";

type Props = {
  account?: SerializedAccount | null;
  onClose: () => void;
};

export function AccountModal({ account, onClose }: Props) {
  const router = useRouter();
  const isEditing = !!account;

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>((account?.type as AccountType) ?? "checking");
  const [institution, setInstitution] = useState(account?.institution ?? "");
  const [balance, setBalance] = useState(account?.balance?.toString() ?? "0");
  const [notes, setNotes] = useState(account?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const data = {
      name: name.trim(),
      type,
      institution: institution.trim() || undefined,
      balance: parseFloat(balance) || 0,
      notes: notes.trim() || undefined,
    };
    if (isEditing) {
      await updateAccount(account.id, data);
    } else {
      await createAccount(data);
    }
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!account) return;
    setDeleting(true);
    await deleteAccount(account.id);
    router.refresh();
    onClose();
  }

  const meta = ACCOUNT_TYPES[type];
  const isLiability = meta?.isLiability;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-surface-raised border border-surface-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-white">
            {isEditing ? "Edit Account" : "Add Account"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Account type */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Account Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ACCOUNT_TYPES) as [AccountType, typeof ACCOUNT_TYPES[AccountType]][]).map(([key, t]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center gap-0.5
                    ${type === key ? `${t.bg} ${t.text} ${t.border}` : "bg-surface border-surface-border text-gray-500 hover:border-gray-500"}`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name + Institution */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Account Name</label>
              <input
                type="text"
                placeholder='e.g. "Main Checking"'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Institution</label>
              <input
                type="text"
                placeholder='e.g. "Chase"'
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              {isLiability ? "Amount Owed" : "Current Balance"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg pl-7 pr-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
              />
            </div>
            {isLiability && (
              <p className="text-xs text-gray-500 mt-1">Enter as a positive number — we&apos;ll treat it as a liability.</p>
            )}
          </div>

          {/* Notes */}
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-accent"
          />

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
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : isEditing ? "Update" : "Add Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
