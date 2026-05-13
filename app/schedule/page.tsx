import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/schedule/CalendarView";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  let events: Awaited<ReturnType<typeof prisma.event.findMany>> = [];
  let tasks: { id: number; title: string; priority: string; dueDate: Date }[] = [];

  try {
    [events, tasks] = await Promise.all([
      prisma.event.findMany({ orderBy: { startTime: "asc" } }),
      prisma.task.findMany({
        where: { dueDate: { not: null }, completed: false, parentId: null },
        select: { id: true, title: true, priority: true, dueDate: true },
        orderBy: { dueDate: "asc" },
      }).then((rows) => rows.filter((r) => r.dueDate !== null) as { id: number; title: string; priority: string; dueDate: Date }[]),
    ]);
  } catch {
    // Database not yet migrated — render empty calendar
  }

  const serializedEvents = events.map((e) => ({
    ...e,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
    recurrenceEnd: e.recurrenceEnd?.toISOString() ?? null,
    lastSyncedAt: e.lastSyncedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  const serializedTodos = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    dueDate: t.dueDate!.toISOString(),
  }));

  return <CalendarView events={serializedEvents} todos={serializedTodos} />;
}
