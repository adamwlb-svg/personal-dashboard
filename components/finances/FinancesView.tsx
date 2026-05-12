"use client";

import { useState } from "react";
import { ACCOUNT_TYPES, AccountType, SerializedAccount, SerializedFinanceTodo, SerializedFinanceChatMessage, calcNetWorth, formatCurrency } from "@/lib/finance";
import { AccountModal } from "./AccountModal";
import { FinanceChat } from "./FinanceChat";
import { FinanceTodos } from "./FinanceTodos";
import { updateBalance } from "@/app/finances/actions";
import { useRouter } from "next/navigation";

type Props = {
  accounts: SerializedAccount[];
  todos: SerializedFinanceTodo[];
  chatMessages: SerializedFinanceChatMessage[];
  aiConfigured: boolean;
};

export function FinancesView({ accounts, todos, chatMessages, aiConfigured }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SerializedAccount | null>(null);
  const [editingBalance, setEditingBalance] = useState<{ id: number; value: string } | null>(null);

  const { assets, liabilities, netWorth } = calcNetWorth(accounts);

  const assetAccounts = accounts.filter(
    (a) => a.isActive && !ACCOUNT_TYPES[a.type as AccountType]?.isLiability
  );
  const liabilityAccounts = accounts.filter(
    (a) => a.isActive && ACCOUNT_TYPES[a.type as AccountType]?.isLiability
  );

  async function handleBalanceSave(id: number) {
    if (!editingBalance || editingBalance.id !== id) return;
    const val = parseFloat(editingBalance.value);
    if (!isNaN(val)) {
      await updateBalance(id, val);
      router.refresh();
    }
    setEditingBalance(null);
  }

  function openAdd() {
    setEditingAccount(null);
    setShowModal(true);
  }

  function openEdit(account: SerializedAccount) {
    setEditingAccount(account);
    setShowModal(true);
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-8">
      {/* Net Worth Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Net Worth</p>
          <p className={`text-4xl font-bold tracking-tight ${netWorth >= 0 ? "text-white" : "text-red-400"}`}>
            {formatCurrency(netWorth)}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-emerald-400">
              <span className="text-gray-500 mr-1">Assets</span>{formatCurrency(assets)}
            </span>
            <span className="text-sm text-red-400">
              <span className="text-gray-500 mr-1">Liabilities</span>{formatCurrency(liabilities)}
            </span>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </button>
      </div>

      {/* Account Groups */}
      {accounts.length === 0 ? (
        <div className="bg-surface-raised border border-surface-border rounded-xl p-10 text-center">
          <p className="text-2xl mb-2">💳</p>
          <p className="text-sm font-medium text-gray-300">No accounts yet</p>
          <p className="text-xs text-gray-500 mt-1 mb-4">Add your checking, savings, investments, and debts to track your net worth.</p>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add your first account
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {assetAccounts.length > 0 && (
            <AccountGroup
              title="Assets"
              accounts={assetAccounts}
              editingBalance={editingBalance}
              setEditingBalance={setEditingBalance}
              onBalanceSave={handleBalanceSave}
              onEdit={openEdit}
            />
          )}
          {liabilityAccounts.length > 0 && (
            <AccountGroup
              title="Liabilities"
              accounts={liabilityAccounts}
              editingBalance={editingBalance}
              setEditingBalance={setEditingBalance}
              onBalanceSave={handleBalanceSave}
              onEdit={openEdit}
            />
          )}
        </div>
      )}

      {/* Bottom grid: todos + chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinanceTodos todos={todos} />
        <FinanceChat initialMessages={chatMessages} aiConfigured={aiConfigured} />
      </div>

      {showModal && (
        <AccountModal
          account={editingAccount}
          onClose={() => {
            setShowModal(false);
            setEditingAccount(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

type GroupProps = {
  title: string;
  accounts: SerializedAccount[];
  editingBalance: { id: number; value: string } | null;
  setEditingBalance: (v: { id: number; value: string } | null) => void;
  onBalanceSave: (id: number) => void;
  onEdit: (a: SerializedAccount) => void;
};

function AccountGroup({ title, accounts, editingBalance, setEditingBalance, onBalanceSave, onEdit }: GroupProps) {
  const total = accounts.reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const isLiability = title === "Liabilities";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h2>
        <span className={`text-sm font-semibold ${isLiability ? "text-red-400" : "text-emerald-400"}`}>
          {formatCurrency(total)}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            editingBalance={editingBalance}
            setEditingBalance={setEditingBalance}
            onBalanceSave={onBalanceSave}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

type CardProps = {
  account: SerializedAccount;
  editingBalance: { id: number; value: string } | null;
  setEditingBalance: (v: { id: number; value: string } | null) => void;
  onBalanceSave: (id: number) => void;
  onEdit: (a: SerializedAccount) => void;
};

function AccountCard({ account, editingBalance, setEditingBalance, onBalanceSave, onEdit }: CardProps) {
  const meta = ACCOUNT_TYPES[account.type as AccountType];
  const isEditing = editingBalance?.id === account.id;

  return (
    <div className={`bg-surface-raised border rounded-xl p-4 flex flex-col gap-3 ${meta?.border ?? "border-surface-border"}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta?.icon ?? "📂"}</span>
          <div>
            <p className="text-sm font-medium text-white leading-tight">{account.name}</p>
            {account.institution && (
              <p className="text-xs text-gray-500">{account.institution}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onEdit(account)}
          className="text-gray-600 hover:text-gray-400 transition-colors"
          aria-label="Edit account"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Balance */}
      {isEditing ? (
        <div className="flex gap-1">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
            <input
              type="number"
              step="0.01"
              autoFocus
              value={editingBalance.value}
              onChange={(e) => setEditingBalance({ id: account.id, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") onBalanceSave(account.id);
                if (e.key === "Escape") setEditingBalance(null);
              }}
              className="w-full bg-surface border border-accent rounded-lg pl-5 pr-2 py-1.5 text-white text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={() => onBalanceSave(account.id)}
            className="px-2 py-1.5 bg-accent rounded-lg text-white text-xs font-medium"
          >
            Save
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditingBalance({ id: account.id, value: Math.abs(account.balance).toString() })}
          className="text-left group"
        >
          <p className={`text-xl font-bold ${meta?.color ?? "text-gray-400"}`}>
            {meta?.isLiability
              ? formatCurrency(Math.abs(account.balance))
              : formatCurrency(account.balance)}
          </p>
          <p className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
            Click to update balance
          </p>
        </button>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${meta?.bg} ${meta?.text} ${meta?.border}`}>
          {meta?.label ?? account.type}
        </span>
        {account.notes && (
          <span className="text-xs text-gray-600 truncate ml-2">{account.notes}</span>
        )}
      </div>
    </div>
  );
}
