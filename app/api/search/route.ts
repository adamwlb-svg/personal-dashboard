import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export type SearchResult = {
  type: "event" | "task" | "contact" | "link";
  id: number;
  title: string;
  subtitle: string;
  href: string;
  emoji?: string | null;
  newTab?: boolean;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const contains = { contains: q, mode: "insensitive" as const };

  try {
    const [events, tasks, contacts, links] = await Promise.all([
      prisma.event.findMany({
        where: { title: contains },
        orderBy: { startTime: "asc" },
        take: 5,
        select: { id: true, title: true, emoji: true, startTime: true, category: true },
      }),
      prisma.task.findMany({
        where: { title: contains, completed: false, parentId: null },
        orderBy: { dueDate: "asc" },
        take: 5,
        select: { id: true, title: true, emoji: true, priority: true, dueDate: true },
      }),
      prisma.healthContact.findMany({
        where: { OR: [{ name: contains }, { role: contains }] },
        take: 5,
        select: { id: true, name: true, role: true },
      }),
      prisma.quickLink.findMany({
        where: { OR: [{ title: contains }, { url: contains }] },
        take: 5,
        select: { id: true, title: true, url: true, emoji: true, category: true },
      }),
    ]);

    const results: SearchResult[] = [
      ...events.map((e) => ({
        type: "event" as const,
        id: e.id,
        title: e.title,
        subtitle: `${e.category} · ${new Date(e.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        href: "/schedule",
        emoji: e.emoji,
      })),
      ...tasks.map((t) => ({
        type: "task" as const,
        id: t.id,
        title: t.title,
        subtitle: t.dueDate
          ? `Due ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : `Priority: ${t.priority}`,
        href: "/todo",
        emoji: t.emoji,
      })),
      ...contacts.map((c) => ({
        type: "contact" as const,
        id: c.id,
        title: c.name,
        subtitle: c.role,
        href: "/health",
      })),
      ...links.map((l) => ({
        type: "link" as const,
        id: l.id,
        title: l.title,
        subtitle: l.category,
        href: l.url,
        emoji: l.emoji,
        newTab: true,
      })),
    ];

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
