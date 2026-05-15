import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ configured: false });

  await prisma.businessChatMessage.create({ data: { role: "user", content: message } });

  // Pull existing ideas for context
  const ideas = await prisma.businessIdea.findMany({ orderBy: { updatedAt: "desc" }, take: 20 }).catch(() => []);
  const ideasContext = ideas.length > 0
    ? ideas.map((i) => `- [${i.stage.toUpperCase()}] ${i.title}${i.description ? `: ${i.description}` : ""}`).join("\n")
    : "No ideas logged yet.";

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: `You are an expert startup advisor and market strategist. You combine the analytical rigor of a top-tier VC with the hands-on pragmatism of a repeat founder.

Your primary focus areas:
1. **White space identification** — surface market gaps, underserved segments, emerging behavioral shifts, and overlooked problems worth solving. Think about incumbents' blind spots, regulatory changes creating new openings, and technology shifts enabling new business models.
2. **Idea pressure-testing** — probe every idea with hard questions: Who exactly is the customer? What is the hair-on-fire problem? Why hasn't this been built? What does the competitive moat look like in 5 years? What has to be true for this to scale?
3. **Go-to-market strategy** — help identify the smallest viable wedge, the ideal first 10 customers, and distribution leverage.
4. **Honest risk assessment** — call out where ideas are weak without being discouraging. Distinguish lifestyle businesses from venture-scale opportunities without judging either.
5. **Adjacent opportunities** — when discussing an idea, always consider what related white spaces exist nearby.

Frameworks you naturally apply: jobs-to-be-done, value chain disruption, platform vs. product, distribution as competitive advantage, network effects, regulatory arbitrage, and technology S-curves.

Be direct and specific. Avoid startup clichés and generic advice. Ask one sharp follow-up question when you need more information rather than a list of questions. Reference real market analogies when they're genuinely instructive.

The user's current idea pipeline:
${ideasContext}

When they discuss an idea from their pipeline, reference it by name and build on previous context.`,
    messages: [
      ...history.slice(-16).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ],
  });

  const reply = response.content[0].type === "text" ? response.content[0].text : "";
  await prisma.businessChatMessage.create({ data: { role: "assistant", content: reply } });

  return NextResponse.json({ configured: true, message: reply });
}
