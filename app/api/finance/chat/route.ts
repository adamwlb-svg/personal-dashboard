import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcNetWorth, formatCurrency, formatAccountsForAI, SerializedAccount } from "@/lib/finance";

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── AI not configured yet ──────────────────────────────────────────────────
  // Add ANTHROPIC_API_KEY to Vercel environment variables to activate.
  if (!apiKey) {
    return NextResponse.json({ configured: false });
  }

  await prisma.financeChatMessage.create({ data: { role: "user", content: message } });

  // ── Build financial context ────────────────────────────────────────────────
  const [accounts, financeTodos] = await Promise.all([
    prisma.financialAccount.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
    prisma.task.findMany({
      where: { category: "finance", completed: false, parentId: null },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      take: 10,
    }),
  ]);

  const serializedAccounts: SerializedAccount[] = accounts.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const { assets, liabilities, netWorth } = calcNetWorth(serializedAccounts);

  const todosContext =
    financeTodos.length > 0
      ? financeTodos
          .map((t) => `- ${t.title} [${t.priority} priority]${t.dueDate ? ` · due ${t.dueDate.toLocaleDateString()}` : ""}`)
          .join("\n")
      : "No open finance tasks.";

  // ── Call Claude ────────────────────────────────────────────────────────────
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are a personal finance assistant. Be concise, specific, and reference the user's actual numbers.

Financial snapshot:
${formatAccountsForAI(serializedAccounts)}

Net Worth: ${formatCurrency(netWorth)}
Total Assets: ${formatCurrency(assets)}
Total Liabilities: ${formatCurrency(liabilities)}

Open finance tasks:
${todosContext}

When answering, use the user's real account data. Provide actionable advice grounded in their actual financial situation. Format currency clearly.`,
    messages: [
      ...history.slice(-12).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ],
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";

  await prisma.financeChatMessage.create({ data: { role: "assistant", content: reply } });

  return NextResponse.json({ configured: true, message: reply });
}
