export const ACCOUNT_TYPES = {
  checking:    { label: "Checking",    isLiability: false, icon: "🏦", color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    chartColor: "#60a5fa" },
  savings:     { label: "Savings",     isLiability: false, icon: "💰", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", chartColor: "#34d399" },
  investment:  { label: "Investment",  isLiability: false, icon: "📈", color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20",  chartColor: "#a78bfa" },
  credit_card: { label: "Credit Card", isLiability: true,  icon: "💳", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     chartColor: "#f87171" },
  loan:        { label: "Loan",        isLiability: true,  icon: "🏠", color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  chartColor: "#fb923c" },
  other:       { label: "Other",       isLiability: false, icon: "📂", color: "text-gray-400",    bg: "bg-gray-500/10",    border: "border-gray-500/20",    chartColor: "#9ca3af" },
} as const;

export type AccountType = keyof typeof ACCOUNT_TYPES;

export type SerializedAccount = {
  id: number;
  name: string;
  type: string;
  institution: string | null;
  balance: number;
  currency: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SerializedSnapshot = {
  id: number;
  accountId: number;
  balance: number;
  recordedAt: string;
};

export type SerializedGoal = {
  id: number;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SerializedFinanceTodo = {
  id: number;
  title: string;
  priority: string;
  dueDate: string | null;
  completed: boolean;
  notes: string | null;
};

export type SerializedFinanceChatMessage = {
  id: number;
  role: string;
  content: string;
  createdAt: string;
};

export function calcNetWorth(accounts: SerializedAccount[]) {
  const active = accounts.filter((a) => a.isActive);
  const assets = active
    .filter((a) => !ACCOUNT_TYPES[a.type as AccountType]?.isLiability)
    .reduce((sum, a) => sum + a.balance, 0);
  const liabilities = active
    .filter((a) => ACCOUNT_TYPES[a.type as AccountType]?.isLiability)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);
  return { assets, liabilities, netWorth: assets - liabilities };
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatAccountsForAI(accounts: SerializedAccount[]): string {
  if (accounts.length === 0) return "No accounts added yet.";
  return accounts
    .filter((a) => a.isActive)
    .map((a) => {
      const type = ACCOUNT_TYPES[a.type as AccountType];
      const label = type?.isLiability ? `${formatCurrency(Math.abs(a.balance))} owed` : formatCurrency(a.balance);
      return `${a.name}${a.institution ? ` (${a.institution})` : ""} — ${type?.label ?? a.type}: ${label}`;
    })
    .join("\n");
}

export type NetWorthPoint = { date: string; netWorth: number };

export function buildNetWorthHistory(
  accounts: SerializedAccount[],
  snapshots: SerializedSnapshot[]
): NetWorthPoint[] {
  if (snapshots.length === 0) return [];

  const sorted = [...snapshots].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  // Build per-account sorted history
  const accountHistory = new Map<number, Array<{ date: string; balance: number }>>();
  for (const snap of sorted) {
    const date = snap.recordedAt.substring(0, 10);
    if (!accountHistory.has(snap.accountId)) accountHistory.set(snap.accountId, []);
    accountHistory.get(snap.accountId)!.push({ date, balance: snap.balance });
  }

  // Unique dates across all snapshots
  const dates = Array.from(new Set(sorted.map((s) => s.recordedAt.substring(0, 10)))).sort();

  return dates.map((date) => {
    let netWorth = 0;
    for (const account of accounts) {
      const history = accountHistory.get(account.id) ?? [];
      const relevant = history.filter((h) => h.date <= date);
      if (relevant.length === 0) continue;
      const balance = relevant[relevant.length - 1].balance;
      const isLiability = ACCOUNT_TYPES[account.type as AccountType]?.isLiability;
      netWorth += isLiability ? -Math.abs(balance) : balance;
    }
    return { date, netWorth };
  });
}

export type AllocationSlice = { type: AccountType; label: string; amount: number; color: string; chartColor: string; pct: number };

export function buildAllocation(accounts: SerializedAccount[]): AllocationSlice[] {
  const active = accounts.filter((a) => a.isActive && !ACCOUNT_TYPES[a.type as AccountType]?.isLiability);
  const total = active.reduce((sum, a) => sum + a.balance, 0);
  if (total === 0) return [];

  const map = new Map<string, number>();
  for (const a of active) {
    map.set(a.type, (map.get(a.type) ?? 0) + a.balance);
  }

  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, amount]) => {
      const meta = ACCOUNT_TYPES[type as AccountType];
      return {
        type: type as AccountType,
        label: meta?.label ?? type,
        amount,
        color: meta?.color ?? "text-gray-400",
        chartColor: meta?.chartColor ?? "#9ca3af",
        pct: total > 0 ? (amount / total) * 100 : 0,
      };
    });
}
