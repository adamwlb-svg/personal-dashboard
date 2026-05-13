import { prisma } from "@/lib/prisma";
import { HealthView } from "@/components/health/HealthView";
import {
  SerializedSupplementEntry,
  SerializedDailySupplement,
  SerializedWorkout,
} from "@/lib/health";
import { SerializedFinanceTodo } from "@/lib/finance";
import { ensureDailyStackLogged } from "./actions";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  // Auto-log the daily stack once per day before rendering
  await ensureDailyStackLogged();
  let appointments: Awaited<ReturnType<typeof prisma.event.findMany>> = [];
  let metrics: Awaited<ReturnType<typeof prisma.healthMetric.findMany>> = [];
  let chatMessages: Awaited<ReturnType<typeof prisma.healthChatMessage.findMany>> = [];
  let supplements: Awaited<ReturnType<typeof prisma.supplementEntry.findMany>> = [];
  let dailyStack: Awaited<ReturnType<typeof prisma.dailySupplement.findMany>> = [];
  let workouts: Awaited<ReturnType<typeof prisma.workoutEntry.findMany>> = [];
  let todos: Awaited<ReturnType<typeof prisma.task.findMany>> = [];

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    [appointments, metrics, chatMessages, supplements, dailyStack, workouts, todos] = await Promise.all([
      prisma.event.findMany({
        where: { category: "health", startTime: { gte: new Date() } },
        orderBy: { startTime: "asc" },
        take: 6,
      }),
      prisma.healthMetric.findMany({
        where: { loggedAt: { gte: thirtyDaysAgo } },
        orderBy: { loggedAt: "asc" },
      }),
      prisma.healthChatMessage.findMany({ orderBy: { createdAt: "asc" }, take: 40 }),
      prisma.supplementEntry.findMany({
        where: { loggedAt: { gte: thirtyDaysAgo } },
        orderBy: { loggedAt: "desc" },
      }).catch(() => []),
      prisma.dailySupplement.findMany({
        orderBy: { sortOrder: "asc" },
      }).catch(() => []),
      prisma.workoutEntry.findMany({
        where: { loggedAt: { gte: thirtyDaysAgo } },
        orderBy: { loggedAt: "desc" },
      }).catch(() => []),
      prisma.task.findMany({
        where: { category: "health", parentId: null },
        orderBy: [{ completed: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
      }),
    ]);
  } catch {
    // Database not yet migrated — render empty state
  }

  const serializedAppointments = appointments.map((e) => ({
    id: e.id, title: e.title,
    startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString(),
    location: e.location, allDay: e.allDay,
  }));

  const serializedMetrics = metrics.map((m) => ({
    id: m.id, type: m.type, value: m.value, unit: m.unit,
    notes: m.notes, loggedAt: m.loggedAt.toISOString(),
  }));

  const serializedMessages = chatMessages.map((m) => ({
    id: m.id, role: m.role, content: m.content, createdAt: m.createdAt.toISOString(),
  }));

  const serializedSupplements: SerializedSupplementEntry[] = supplements.map((s) => ({
    id: s.id, name: s.name, amount: s.amount, unit: s.unit,
    notes: s.notes, loggedAt: s.loggedAt.toISOString(),
  }));

  const serializedDailyStack: SerializedDailySupplement[] = dailyStack.map((s) => ({
    id: s.id, name: s.name, amount: s.amount, unit: s.unit,
    isActive: s.isActive, sortOrder: s.sortOrder,
  }));

  const serializedWorkouts: SerializedWorkout[] = workouts.map((w) => ({
    id: w.id, activity: w.activity, minutes: w.minutes,
    notes: w.notes, loggedAt: w.loggedAt.toISOString(),
  }));

  const serializedTodos: SerializedFinanceTodo[] = todos.map((t) => ({
    id: t.id, title: t.title, priority: t.priority,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    completed: t.completed, notes: t.notes,
  }));

  return (
    <div className="p-8 overflow-y-auto flex-1">
      <HealthView
        appointments={serializedAppointments}
        metrics={serializedMetrics}
        supplements={serializedSupplements}
        dailyStack={serializedDailyStack}
        workouts={serializedWorkouts}
        todos={serializedTodos}
        chatMessages={serializedMessages}
        aiConfigured={!!process.env.ANTHROPIC_API_KEY}
      />
    </div>
  );
}
