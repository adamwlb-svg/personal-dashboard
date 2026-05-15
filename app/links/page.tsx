import { prisma } from "@/lib/prisma";
import { QuickLinksView } from "@/components/links/QuickLinksView";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  let links: Awaited<ReturnType<typeof prisma.quickLink.findMany>> = [];

  try {
    links = await prisma.quickLink.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    });
  } catch {
    // DB not yet migrated
  }

  const serialized = links.map((l) => ({
    id: l.id,
    title: l.title,
    url: l.url,
    category: l.category,
    emoji: l.emoji,
    sortOrder: l.sortOrder,
  }));

  return (
    <div className="p-8 overflow-y-auto flex-1">
      <QuickLinksView links={serialized} />
    </div>
  );
}
