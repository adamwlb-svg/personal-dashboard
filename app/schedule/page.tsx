import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/schedule/CalendarView";

export default async function SchedulePage() {
  const events = await prisma.event.findMany({
    orderBy: { startTime: "asc" },
  });

  // Serialize Dates to strings for client component boundary
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
