import { prisma } from "@/lib/prisma";
import { CATEGORIES, CategoryKey } from "@/lib/calendar";
import { GREWords } from "@/components/GREWords";
import { WeatherWidget } from "@/components/WeatherWidget";

export const dynamic = "force-dynamic";

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function getWeekBounds() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDueDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const PRIORITY_COLORS: Record<string, string> = {
  high:   "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low:    "bg-fg-4/20 text-fg-3 border-fg-4/30",
};

export default async function DashboardPage() {
  const { monday, sunday } = getWeekBounds();

  let events: { id: number; title: string; startTime: Date; endTime: Date; allDay: boolean; category: string }[] = [];
  let todos: { id: number; title: string; priority: string; dueDate: Date | null; completed: boolean }[] = [];

  try {
    [events, todos] = await Promise.all([
      prisma.event.findMany({
        where: { startTime: { gte: monday, lte: sunday } },
        orderBy: { startTime: "asc" },
        select: { id: true, title: true, startTime: true, endTime: true, allDay: true, category: true },
      }),
      prisma.task.findMany({
        where: {
          completed: false,
          parentId: null,
          dueDate: { gte: monday, lte: sunday },
        },
        orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
        select: { id: true, title: true, priority: true, dueDate: true, completed: true },
      }),
    ]);
  } catch {
    // DB not ready
  }

  const weekLabel = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  // Group events by day
  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const key = e.startTime.toISOString().substring(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }
  const sortedDays = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));

  const sortedTodos = [...todos].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
  );

  return (
    <div className="p-6 overflow-y-auto flex-1 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-fg">Dashboard</h1>
        <p className="text-sm text-fg-3 mt-0.5">Week of {weekLabel}</p>
      </div>

      {/* ── Weather ──────────────────────────────────────────── */}
      <WeatherWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── This week's schedule ──────────────────────────────── */}
        <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
              <span>📅</span> This Week
            </h2>
            <span className="text-xs text-fg-3">{events.length} event{events.length !== 1 ? "s" : ""}</span>
          </div>

          {events.length === 0 ? (
            <p className="text-xs text-fg-3 text-center py-6">No events scheduled this week.</p>
          ) : (
            <div className="space-y-4">
              {sortedDays.map(([dateKey, dayEvents]) => (
                <div key={dateKey}>
                  <p className="text-xs font-semibold text-fg-3 uppercase tracking-wide mb-1.5">
                    {formatDay(dateKey + "T12:00:00")}
                  </p>
                  <div className="space-y-1.5">
                    {dayEvents.map((ev) => {
                      const cat = CATEGORIES[ev.category as CategoryKey] ?? CATEGORIES.other;
                      return (
                        <div key={ev.id} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border ${cat.bg} ${cat.border}`}>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.dot}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-fg truncate">{ev.title}</p>
                          </div>
                          <p className="text-xs text-fg-3 flex-shrink-0">
                            {ev.allDay ? "All day" : formatTime(ev.startTime.toISOString())}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── To-dos due this week ──────────────────────────────── */}
        <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-fg flex items-center gap-2">
              <span>✅</span> Due This Week
            </h2>
            <span className="text-xs text-fg-3">{sortedTodos.length} task{sortedTodos.length !== 1 ? "s" : ""}</span>
          </div>

          {sortedTodos.length === 0 ? (
            <p className="text-xs text-fg-3 text-center py-6">No tasks due this week.</p>
          ) : (
            <div className="space-y-2">
              {sortedTodos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-3 group">
                  <div className="w-4 h-4 rounded border border-surface-border flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-fg truncate">{todo.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {todo.dueDate && (
                      <span className="text-xs text-fg-3">{formatDueDate(todo.dueDate.toISOString())}</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[todo.priority] ?? PRIORITY_COLORS.medium}`}>
                      {todo.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── GRE Words of the Day ─────────────────────────────── */}
      <GREWords />

    </div>
  );
}
