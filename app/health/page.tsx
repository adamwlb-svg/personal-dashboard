import { prisma } from "@/lib/prisma";
import { HealthView } from "@/components/health/HealthView";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  let appointments: Awaited<ReturnType<typeof prisma.event.findMany>> = [];
  let metrics: Awaited<ReturnType<typeof prisma.healthMetric.findMany>> = [];
  let chatMessages: Awaited<ReturnType<typeof prisma.healthChatMessage.findMany>> = [];

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    [appointments, metrics, chatMessages] = await Promise.all([
      prisma.event.findMany({
        where: { category: "health", startTime: { gte: new Date() } },
        orderBy: { startTime: "asc" },
        take: 6,
      }),
      prisma.healthMetric.findMany({
        where: { loggedAt: { gte: thirtyDaysAgo } },
        orderBy: { loggedAt: "asc" },
      }),
      prisma.healthChatMessage.findMany({
        orderBy: { createdAt: "asc" },
        take: 40,
      }),
    ]);
  } catch {
    // Database not yet migrated — render empty state
  }

  const serializedAppointments = appointments.map((e) => ({
    id: e.id,
    title: e.title,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
    location: e.location,
    allDay: e.allDay,
  }));

  const serializedMetrics = metrics.map((m) => ({
    id: m.id,
    type: m.type,
    value: m.value,
    unit: m.unit,
    notes: m.notes,
    loggedAt: m.loggedAt.toISOString(),
  }));

  const serializedMessages = chatMessages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  const aiConfigured = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="p-8 overflow-y-auto flex-1">
      <HealthView
        appointments={serializedAppointments}
        metrics={serializedMetrics}
        chatMessages={serializedMessages}
        aiConfigured={aiConfigured}
      />
    </div>
  );
}
