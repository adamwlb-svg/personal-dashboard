export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { SerializedAccount, SerializedFinanceTodo, SerializedFinanceChatMessage } from "@/lib/finance";
import { FinancesView } from "@/components/finances/FinancesView";

export default async function FinancesPage() {
  const [accounts, todos, chatMessages] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.task.findMany({
      where: { category: "finance", parentId: null },
      orderBy: [{ completed: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
    }),
    prisma.financeChatMessage.findMany({
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
  ]);

  const serializedAccounts: SerializedAccount[] = accounts.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
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

  const aiConfigured = !!process.env.ANTHROPIC_API_KEY;

  return (
    <FinancesView
      accounts={serializedAccounts}
      todos={serializedTodos}
      chatMessages={serializedMessages}
      aiConfigured={aiConfigured}
    />
  );
}
