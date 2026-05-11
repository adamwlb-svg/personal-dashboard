import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/schedule/CalendarView";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  let events: Awaited<ReturnType<typeof prisma.event.findMany>> = [];

  try {
    events = await prisma.event.findMany({ orderBy: { startTime: "asc" } });
  } catch {
    // Database not yet migrated — render empty calendar
  }

  const serialized = events.map((e) => ({
    ...e,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
    recurrenceEnd: e.recurrenceEnd?.toISOString() ?? null,
    lastSyncedAt: e.lastSyncedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return <CalendarView events={serialized} />;
}
