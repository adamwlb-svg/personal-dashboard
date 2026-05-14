export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import {
  SerializedAccount,
  SerializedSnapshot,
  SerializedGoal,
  SerializedFinanceTodo,
  SerializedFinanceChatMessage,
} from "@/lib/finance";
import { SerializedRecurringExpense } from "@/components/finances/RecurringExpenses";
import { FinancesView } from "@/components/finances/FinancesView";

export default async function FinancesPage() {
  const [accounts, snapshots, goals, todos, chatMessages, recurringExpenses] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.balanceSnapshot.findMany({
      orderBy: { recordedAt: "asc" },
    }),
    prisma.financialGoal.findMany({ orderBy: { createdAt: "asc" } }).catch(() => []),
    prisma.task.findMany({
      where: { category: "finance", parentId: null },
      orderBy: [{ completed: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
    }),
    prisma.financeChatMessage.findMany({
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    prisma.recurringExpense.findMany({ orderBy: { nextDueDate: "asc" } }).catch(() => []),
  ]);

  const serializedAccounts: SerializedAccount[] = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    institution: a.institution,
    balance: a.balance,
    currency: a.currency,
    isActive: a.isActive,
    notes: a.notes,
    plaidAccountId: a.plaidAccountId,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const serializedSnapshots: SerializedSnapshot[] = snapshots.map((s) => ({
    id: s.id,
    accountId: s.accountId,
    balance: s.balance,
    recordedAt: s.recordedAt.toISOString(),
  }));

  const serializedGoals: SerializedGoal[] = goals.map((g) => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    targetDate: g.targetDate ? g.targetDate.toISOString() : null,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }));

  const serializedTodos: SerializedFinanceTodo[] = todos.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    completed: t.completed,
    notes: t.notes,
  }));

  const serializedMessages: SerializedFinanceChatMessage[] = chatMessages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  const serializedExpenses: SerializedRecurringExpense[] = recurringExpenses.map((e) => ({
    id: e.id,
    name: e.name,
    amount: e.amount,
    frequency: e.frequency,
    category: e.category,
    isAutoPay: e.isAutoPay,
    nextDueDate: e.nextDueDate.toISOString(),
    notes: e.notes,
    eventId: e.eventId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return (
    <FinancesView
      accounts={serializedAccounts}
      snapshots={serializedSnapshots}
      goals={serializedGoals}
      todos={serializedTodos}
      chatMessages={serializedMessages}
      aiConfigured={!!process.env.ANTHROPIC_API_KEY}
      expenses={serializedExpenses}
    />
  );
}
