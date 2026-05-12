export const ACCOUNT_TYPES = {
  checking:    { label: "Checking",    isLiability: false, icon: "🏦", color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  savings:     { label: "Savings",     isLiability: false, icon: "💰", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  investment:  { label: "Investment",  isLiability: false, icon: "📈", color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
  credit_card: { label: "Credit Card", isLiability: true,  icon: "💳", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
  loan:        { label: "Loan",        isLiability: true,  icon: "🏠", color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
  other:       { label: "Other",       isLiability: false, icon: "📂", color: "text-gray-400",    bg: "bg-gray-500/10",    border: "border-gray-500/20" },
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

export function formatCurrency(amount: number): string {
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
