import { prisma } from "@/lib/prisma";
import { BusinessView } from "@/components/business/BusinessView";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  let ideas: Awaited<ReturnType<typeof prisma.businessIdea.findMany>> = [];
  let chatMessages: Awaited<ReturnType<typeof prisma.businessChatMessage.findMany>> = [];

  try {
    [ideas, chatMessages] = await Promise.all([
      prisma.businessIdea.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.businessChatMessage.findMany({ orderBy: { createdAt: "asc" }, take: 60 }),
    ]);
  } catch {
    // DB not yet migrated
  }

  const serializedIdeas = ideas.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    stage: i.stage,
    tags: i.tags,
    notes: i.notes,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  const serializedMessages = chatMessages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="p-8 overflow-y-auto flex-1">
      <BusinessView
        ideas={serializedIdeas}
        chatMessages={serializedMessages}
        aiConfigured={!!process.env.ANTHROPIC_API_KEY}
      />
    </div>
  );
}
