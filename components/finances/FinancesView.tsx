"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ACCOUNT_TYPES,
  AccountType,
  SerializedAccount,
  SerializedSnapshot,
  SerializedGoal,
  SerializedFinanceTodo,
  SerializedFinanceChatMessage,
  calcNetWorth,
  buildNetWorthHistory,
  buildAllocation,
  formatCurrency,
} from "@/lib/finance";
import { AccountModal } from "./AccountModal";
import { GoalModal } from "./GoalModal";
import { NetWorthChart } from "./NetWorthChart";
import { AllocationBar } from "./AllocationBar";
import { FinanceChat } from "./FinanceChat";
import { FinanceTodos } from "./FinanceTodos";
import { PlaidConnect } from "./PlaidConnect";
import { StockTicker } from "./StockTicker";
import { updateBalance } from "@/app/finances/actions";

type Props = {
  accounts: SerializedAccount[];
  snapshots: SerializedSnapshot[];
  goals: SerializedGoal[];
  todos: SerializedFinanceTodo[];
  chatMessages: SerializedFinanceChatMessage[];
  aiConfigured: boolean;
};

export function FinancesView({ accounts, snapshots, goals, todos, chatMessages, aiConfigured }: Props) {
  const router = useRouter();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SerializedAccount | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SerializedGoal | null>(null);
  const [editingBalance, setEditingBalance] = useState<{ id: number; value: string } | null>(null);

  const { assets, liabilities, netWorth } = calcNetWorth(accounts);

  const netWorthHistory = useMemo(() => buildNetWorthHistory(accounts, snapshots), [accounts, snapshots]);
  const allocation = useMemo(() => buildAllocation(accounts), [accounts]);

  // Month-over-month change
  const monthChange = useMemo(() => {
    if (netWorthHistory.length < 2) return null;
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().substring(0, 10);
    const past = netWorthHistory.filter((p) => p.date <= monthAgo);
    if (past.length === 0) return null;
    return netWorth - past[past.length - 1].netWorth;
  }, [netWorthHistory, netWorth]);

  // Liquid = checking + savings
  const liquid = accounts
    .filter((a) => a.isActive && (a.type === "checking" || a.type === "savings"))
    .reduce((s, a) => s + a.balance, 0);

  // Invested = investment accounts
  const invested = accounts
    .filter((a) => a.isActive && a.type === "investment")
    .reduce((s, a) => s + a.balance, 0);

  const assetAccounts = accounts.filter((a) => a.isActive && !ACCOUNT_TYPES[a.type as AccountType]?.isLiability);
  const liabilityAccounts = accounts.filter((a) => a.isActive && ACCOUNT_TYPES[a.type as AccountType]?.isLiability);
  const plaidConnectedCount = accounts.filter((a) => a.plaidAccountId).length;

  // Per-account sparkline data from snapshots
  const sparklineData = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const snap of snapshots) {
      if (!map.has(snap.accountId)) map.set(snap.accountId, []);
      map.get(snap.accountId)!.push(snap.balance);
    }
    return map;
  }, [snapshots]);

  async function handleBalanceSave(id: number) {
    if (!editingBalance || editingBalance.id !== id) return;
    const val = parseFloat(editingBalance.value);
    if (!isNaN(val)) {
      await updateBalance(id, val);
      router.refresh();
    }
    setEditingBalance(null);
  }

  function closeAccountModal() {
    setShowAccountModal(false);
    setEditingAccount(null);
    router.refresh();
  }

  function closeGoalModal() {
    setShowGoalModal(false);
    setEditingGoal(null);
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* ── Net Worth Header + Chart ──────────────────────────── */}
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-fg-3 uppercase tracking-wider mb-1">Net Worth</p>
              <div className="flex items-baseline gap-3">
                <p className={`text-4xl font-bold tracking-tight ${netWorth >= 0 ? "text-fg" : "text-red-400"}`}>
                  {formatCurrency(netWorth)}
                </p>
                {monthChange !== null && (
                  <span className={`text-sm font-medium ${monthChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {monthChange >= 0 ? "+" : ""}{formatCurrency(monthChange, true)} this month
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <PlaidConnect connectedCount={plaidConnectedCount} />
              <button
                onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-fg text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Manual
              </button>
            </div>
          </div>
          <NetWorthChart data={netWorthHistory} />
        </div>

        {/* ── Key Metrics ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Liquid" value={formatCurrency(liquid, true)} sub="Checking + Savings" color="text-blue-400" />
          <MetricCard label="Invested" value={formatCurrency(invested, true)} sub="Investment accounts" color="text-violet-400" />
          <MetricCard label="Total Debt" value={formatCurrency(liabilities, true)} sub="All liabilities" color="text-red-400" />
          <MetricCard
            label="Debt-to-Asset"
            value={assets > 0 ? `${((liabilities / assets) * 100).toFixed(0)}%` : "—"}
            sub={liabilities / assets < 0.3 ? "Healthy ratio" : liabilities / assets < 0.5 ? "Moderate" : "High"}
            color={liabilities / assets < 0.3 ? "text-emerald-400" : liabilities / assets < 0.5 ? "text-yellow-400" : "text-red-400"}
          />
        </div>

        {/* ── To-Dos ───────────────────────────────────────────── */}
        <FinanceTodos todos={todos} />

        {/* ── Allocation + Goals ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-fg mb-4">Asset Allocation</h3>
            <AllocationBar slices={allocation} total={assets} />
          </div>
          <div className="bg-surface-raised border border-surface-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-fg">Financial Goals</h3>
              <button
                onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
                className="text-xs text-accent hover:text-accent-hover transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Goal
              </button>
            </div>
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-fg-3">Set savings goals — emergency fund, vacation, home down payment, and more.</p>
                <button
                  onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
                  className="mt-3 text-xs text-accent hover:underline"
                >
                  Add your first goal →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <GoalRow
                    key={goal.id}
                    goal={goal}
                    onEdit={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Accounts ──────────────────────────────────────────── */}
        {accounts.length === 0 ? (
          <div className="bg-surface-raised border border-surface-border rounded-2xl p-10 text-center">
            <p className="text-2xl mb-2">💳</p>
            <p className="text-sm font-medium text-fg-2">No accounts yet</p>
            <p className="text-xs text-fg-3 mt-1 mb-4">
              Add your checking, savings, investments, and debts to track your net worth.
            </p>
            <button
              onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-fg text-sm font-medium rounded-lg transition-colors"
            >
              Add your first account
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {assetAccounts.length > 0 && (
              <AccountGroup
                title="Assets"
                total={assets}
                accounts={assetAccounts}
                sparklineData={sparklineData}
                editingBalance={editingBalance}
                setEditingBalance={setEditingBalance}
                onBalanceSave={handleBalanceSave}
                onEdit={(a) => { setEditingAccount(a); setShowAccountModal(true); }}
              />
            )}
            {liabilityAccounts.length > 0 && (
              <AccountGroup
                title="Liabilities"
                total={liabilities}
                accounts={liabilityAccounts}
                sparklineData={sparklineData}
                editingBalance={editingBalance}
                setEditingBalance={setEditingBalance}
                onBalanceSave={handleBalanceSave}
                onEdit={(a) => { setEditingAccount(a); setShowAccountModal(true); }}
              />
            )}
          </div>
        )}

        {/* ── Stock Ticker ──────────────────────────────────────── */}
        <StockTicker />

        {/* ── Chat ──────────────────────────────────────────────── */}
        <FinanceChat initialMessages={chatMessages} aiConfigured={aiConfigured} />

      </div>

      {showAccountModal && (
        <AccountModal account={editingAccount} onClose={closeAccountModal} />
      )}
      {showGoalModal && (
        <GoalModal goal={editingGoal} onClose={closeGoalModal} />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-surface-raised border border-surface-border rounded-xl p-4">
      <p className="text-xs text-fg-3 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-fg-3 mt-0.5">{sub}</p>
    </div>
  );
}

function GoalRow({ goal, onEdit }: { goal: SerializedGoal; onEdit: () => void }) {
  const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysLeft = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <button onClick={onEdit} className="flex items-center gap-2 group text-left">
          <span className="text-base">{goal.emoji}</span>
          <span className="text-sm text-fg group-hover:text-fg transition-colors">{goal.name}</span>
        </button>
        <div className="text-right">
          <span className="text-xs font-medium text-fg-2">{pct.toFixed(0)}%</span>
          {daysLeft !== null && (
            <span className={`text-xs ml-2 ${daysLeft < 30 ? "text-yellow-400" : "text-fg-3"}`}>
              {daysLeft > 0 ? `${daysLeft}d left` : "Past due"}
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-fg-3">
        <span>{formatCurrency(goal.currentAmount, true)} saved</span>
        <span>{remaining > 0 ? `${formatCurrency(remaining, true)} to go` : "Complete!"}</span>
      </div>
    </div>
  );
}

type GroupProps = {
  title: string;
  total: number;
  accounts: SerializedAccount[];
  sparklineData: Map<number, number[]>;
  editingBalance: { id: number; value: string } | null;
  setEditingBalance: (v: { id: number; value: string } | null) => void;
  onBalanceSave: (id: number) => void;
  onEdit: (a: SerializedAccount) => void;
};

function AccountGroup({ title, total, accounts, sparklineData, editingBalance, setEditingBalance, onBalanceSave, onEdit }: GroupProps) {
  const isLiability = title === "Liabilities";
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-fg-3 uppercase tracking-wider">{title}</h2>
        <span className={`text-sm font-semibold ${isLiability ? "text-red-400" : "text-emerald-400"}`}>
          {formatCurrency(total)}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            sparkline={sparklineData.get(account.id) ?? []}
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
  sparkline: number[];
  editingBalance: { id: number; value: string } | null;
  setEditingBalance: (v: { id: number; value: string } | null) => void;
  onBalanceSave: (id: number) => void;
  onEdit: (a: SerializedAccount) => void;
};

function AccountCard({ account, sparkline, editingBalance, setEditingBalance, onBalanceSave, onEdit }: CardProps) {
  const meta = ACCOUNT_TYPES[account.type as AccountType];
  const isEditing = editingBalance?.id === account.id;

  // Mini sparkline SVG
  const SparklineSvg = () => {
    if (sparkline.length < 2) return null;
    const W = 60; const H = 24;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;
    const pts = sparkline
      .map((v, i) => `${(i / (sparkline.length - 1)) * W},${H - ((v - min) / range) * H}`)
      .join(" ");
    const isUp = sparkline[sparkline.length - 1] >= sparkline[0];
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <polyline points={pts} fill="none" stroke={isUp ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className={`bg-surface-raised border rounded-xl p-4 flex flex-col gap-3 hover:border-gray-600 transition-colors ${meta?.border ?? "border-surface-border"}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta?.icon ?? "📂"}</span>
          <div>
            <p className="text-sm font-medium text-fg leading-tight">{account.name}</p>
            {account.institution && <p className="text-xs text-fg-3">{account.institution}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <SparklineSvg />
          <button onClick={() => onEdit(account)} className="text-fg-3 hover:text-fg-2 transition-colors ml-1" aria-label="Edit">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="flex gap-1">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-fg-2 text-xs">$</span>
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
              className="w-full bg-surface border border-accent rounded-lg pl-5 pr-2 py-1.5 text-fg text-sm focus:outline-none"
            />
          </div>
          <button onClick={() => onBalanceSave(account.id)} className="px-2 py-1.5 bg-accent rounded-lg text-fg text-xs font-medium">
            Save
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditingBalance({ id: account.id, value: Math.abs(account.balance).toString() })}
          className="text-left group"
        >
          <p className={`text-xl font-bold ${meta?.color ?? "text-fg-2"}`}>
            {meta?.isLiability ? formatCurrency(Math.abs(account.balance)) : formatCurrency(account.balance)}
          </p>
          <p className="text-xs text-fg-3 group-hover:text-fg-2 transition-colors">
            Click to update balance
          </p>
        </button>
      )}

      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${meta?.bg} ${meta?.color} ${meta?.border}`}>
          {meta?.label ?? account.type}
        </span>
        {account.plaidAccountId && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
        {account.notes && <span className="text-xs text-fg-3 truncate">{account.notes}</span>}
      </div>
    </div>
  );
}
