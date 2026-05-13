import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { METRIC_TYPES, MetricType } from "@/lib/health";

const LOG_METRIC_TOOL = {
  name: "log_metric",
  description:
    "Log a health metric (weight, sleep duration, or calorie intake) to the database. Use this whenever the user mentions tracking or logging a specific value for one of these metrics. For exercise/workouts, use log_workout instead.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["weight", "sleep", "calories"],
        description: "The metric type to log",
      },
      value: { type: "number", description: "The numeric value to log" },
      unit: { type: "string", description: "Unit override (optional — defaults are lbs, hrs, cal)" },
      notes: { type: "string", description: "Optional notes about this entry" },
    },
    required: ["type", "value"],
  },
};

const LOG_WORKOUT_TOOL = {
  name: "log_workout",
  description:
    "Log an exercise or workout session. Use this when the user mentions any physical activity — running, gym, yoga, cycling, sports, etc.",
  input_schema: {
    type: "object" as const,
    properties: {
      activity: { type: "string", description: "Activity name, e.g. 'Run', 'Gym', 'Yoga', 'Cycle'" },
      minutes: { type: "number", description: "Duration in minutes" },
      notes: { type: "string", description: "Optional notes, e.g. distance, intensity" },
    },
    required: ["activity", "minutes"],
  },
};

const LOG_SUPPLEMENT_TOOL = {
  name: "log_supplement",
  description:
    "Log a supplement taken by the user. Use this when the user mentions taking or logging a vitamin, mineral, protein, or any other supplement.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Supplement name, e.g. 'Vitamin D', 'Omega-3', 'Creatine'" },
      amount: { type: "number", description: "Dosage amount (numeric)" },
      unit: {
        type: "string",
        enum: ["mg", "g", "mcg", "IU", "ml", "capsule", "tablet", "gummy", "scoop"],
        description: "Unit for the dosage",
      },
      notes: { type: "string", description: "Optional notes" },
    },
    required: ["name"],
  },
};

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ configured: false });
  }

  await prisma.healthChatMessage.create({ data: { role: "user", content: message } });

  // Build context
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [recentMetrics, todaySupplements] = await Promise.all([
    prisma.healthMetric.findMany({
      where: { loggedAt: { gte: sevenDaysAgo } },
      orderBy: { loggedAt: "desc" },
    }),
    prisma.supplementEntry.findMany({
      where: { loggedAt: { gte: today } },
      orderBy: { loggedAt: "desc" },
    }).catch(() => []),
  ]);

  const metricsContext =
    recentMetrics.length > 0
      ? recentMetrics
          .map((m) => `${m.type}: ${m.value}${m.unit}${m.notes ? ` (${m.notes})` : ""} — ${new Date(m.loggedAt).toLocaleDateString()}`)
          .join("\n")
      : "No health metrics logged yet.";

  const supplementsContext =
    todaySupplements.length > 0
      ? "Today's supplements: " + todaySupplements.map((s) => `${s.name}${s.amount ? ` ${s.amount}${s.unit}` : ""}`).join(", ")
      : "No supplements logged today.";

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const historyMessages = history.slice(-12).map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const systemPrompt = `You are a personal health assistant. Be concise, practical, and encouraging.

You have tools to log data directly — use them proactively whenever the user mentions:
- A weight measurement → log_metric (weight)
- Sleep duration → log_metric (sleep)
- Exercise / workout → log_metric (exercise, duration in minutes)
- Food / meals / calories → log_metric (calories)
- Any supplement, vitamin, or mineral → log_supplement

After logging, confirm what you recorded and give a brief insight or tip.

When estimating calories from food descriptions, use standard nutritional values.
When estimating exercise duration, use context clues from their description.

User's health data — last 7 days:
${metricsContext}

${supplementsContext}`;

  const tools = [LOG_METRIC_TOOL, LOG_WORKOUT_TOOL, LOG_SUPPLEMENT_TOOL];

  // First Claude call
  const response1 = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages: [...historyMessages, { role: "user", content: message }],
  });

  let reply = "";
  let logged = false;

  if (response1.stop_reason === "tool_use") {
    const toolUseBlocks = response1.content.filter((b) => b.type === "tool_use");
    const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];

    for (const block of toolUseBlocks) {
      if (block.type !== "tool_use") continue;

      let resultText = "";

      if (block.name === "log_workout") {
        const input = block.input as { activity: string; minutes: number; notes?: string };
        await prisma.workoutEntry.create({
          data: { activity: input.activity, minutes: Math.round(input.minutes), notes: input.notes ?? null },
        }).catch(() => null);
        logged = true;
        resultText = `Logged workout: ${input.activity} ${input.minutes} min`;
      } else if (block.name === "log_metric") {
        const input = block.input as { type: string; value: number; unit?: string; notes?: string };
        const metricMeta = METRIC_TYPES[input.type as MetricType];
        const unit = input.unit ?? metricMeta?.unit ?? "unit";
        await prisma.healthMetric.create({
          data: { type: input.type, value: input.value, unit, notes: input.notes ?? null },
        });
        logged = true;
        resultText = `Logged ${input.type}: ${input.value} ${unit}`;
      } else if (block.name === "log_supplement") {
        const input = block.input as { name: string; amount?: number; unit?: string; notes?: string };
        await prisma.supplementEntry.create({
          data: {
            name: input.name,
            amount: input.amount ?? 0,
            unit: input.unit ?? "mg",
            notes: input.notes ?? null,
          },
        }).catch(() => null);
        logged = true;
        resultText = `Logged supplement: ${input.name}${input.amount ? ` ${input.amount}${input.unit ?? "mg"}` : ""}`;
      }

      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: resultText });
    }

    const response2 = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: [
        ...historyMessages,
        { role: "user", content: message },
        { role: "assistant", content: response1.content },
        { role: "user", content: toolResults },
      ],
    });

    const textBlock = response2.content.find((b) => b.type === "text");
    reply = textBlock?.type === "text" ? textBlock.text : "";
  } else {
    const textBlock = response1.content.find((b) => b.type === "text");
    reply = textBlock?.type === "text" ? textBlock.text : "";
  }

  await prisma.healthChatMessage.create({ data: { role: "assistant", content: reply } });

  return NextResponse.json({ configured: true, message: reply, logged });
}
