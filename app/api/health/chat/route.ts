import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── AI not configured yet ──────────────────────────────────────────────────
  // Swap in your ANTHROPIC_API_KEY Vercel env var to activate this endpoint.
  if (!apiKey) {
    return NextResponse.json({ configured: false });
  }

  // ── Save user message ──────────────────────────────────────────────────────
  await prisma.healthChatMessage.create({
    data: { role: "user", content: message },
  });

  // ── Build context from recent metrics ─────────────────────────────────────
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentMetrics = await prisma.healthMetric.findMany({
    where: { loggedAt: { gte: sevenDaysAgo } },
    orderBy: { loggedAt: "desc" },
  });

  const metricsContext =
    recentMetrics.length > 0
      ? recentMetrics
          .map(
            (m) =>
              `${m.type}: ${m.value}${m.unit}${m.notes ? ` (${m.notes})` : ""} — ${new Date(m.loggedAt).toLocaleDateString()}`
          )
          .join("\n")
      : "No health metrics logged yet.";

  // ── Call Claude ────────────────────────────────────────────────────────────
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are a personal health assistant. Be concise, practical, and encouraging.

When the user mentions food or meals:
- Estimate calories and key macronutrients (protein, carbs, fat)
- Note anything notable about the nutritional profile

When the user mentions exercise or physical activity:
- Estimate calories burned based on typical values
- Note duration and intensity

Track patterns and provide personalized insights based on their logged history.
Always ground advice in their actual data when available.

User's health data — last 7 days:
${metricsContext}`,
    messages: [
      ...history.slice(-12).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ],
  });

  const reply =
    response.content[0].type === "text" ? response.content[0].text : "";

  // ── Save assistant reply ───────────────────────────────────────────────────
  await prisma.healthChatMessage.create({
    data: { role: "assistant", content: reply },
  });

  return NextResponse.json({ configured: true, message: reply });
}
