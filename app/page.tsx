import { prisma } from "@/lib/prisma";
import { CATEGORIES, CategoryKey } from "@/lib/calendar";
import { ACCOUNT_TYPES, AccountType } from "@/lib/finance";
import { GREWords } from "@/components/GREWords";
import { WeatherWidget } from "@/components/WeatherWidget";
import { CountdownWidget, SerializedCountdown } from "@/components/CountdownWidget";

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

function SectionDivider({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-1 h-4 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-3 flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  );
}

export default async function DashboardPage() {
  const { monday, sunday } = getWeekBounds();
  const now = new Date();

  let events: { id: number; title: string; startTime: Date; endTime: Date; allDay: boolean; category: string }[] = [];
  let todos: { id: number; title: string; priority: string; dueDate: Date | null; completed: boolean }[] = [];
  let countdowns: SerializedCountdown[] = [];

  // Pulse row data
  let weekWorkoutCount = 0;
  let overdueCount = 0;
  let openTaskCount = 0;
  let nextEvent: { title: string; startTime: Date } | null = null;
  let netWorth = 0;

  try {
    const [eventsData, todosData, workoutCount, overdue, openTasks, nextEv, accounts, cdData] = await Promise.all([
      prisma.event.findMany({
        where: { startTime: { gte: monday, lte: sunday } },
        orderBy: { startTime: "asc" },
        select: { id: true, title: true, startTime: true, endTime: true, allDay: true, category: true },
      }),
      prisma.task.findMany({
        where: { completed: false, parentId: null, dueDate: { gte: monday, lte: sunday } },
        orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
        select: { id: true, title: true, priority: true, dueDate: true, completed: true },
      }),
      prisma.workoutEntry.count({ where: { loggedAt: { gte: monday, lte: sunday } } }).catch(() => 0),
      prisma.task.count({ where: { completed: false, parentId: null, dueDate: { lt: now } } }).catch(() => 0),
      prisma.task.count({ where: { completed: false, parentId: null } }).catch(() => 0),
      prisma.event.findFirst({ where: { startTime: { gte: now } }, orderBy: { startTime: "asc" }, select: { title: true, startTime: true } }).catch(() => null),
      prisma.financialAccount.findMany({ where: { isActive: true }, select: { balance: true, type: true } }).catch(() => []),
      prisma.countdown.findMany({ orderBy: { date: "asc" } }).catch(() => []),
    ]);
    events = eventsData;
    todos = todosData;
    weekWorkoutCount = workoutCount;
    overdueCount = overdue;
    openTaskCount = openTasks;
    nextEvent = nextEv;
    countdowns = cdData.map((c) => ({ id: c.id, title: c.title, emoji: c.emoji, date: c.date.toISOString() }));

    // Net worth calculation
    for (const a of accounts) {
      const isLiability = ACCOUNT_TYPES[a.type as AccountType]?.isLiability ?? false;
      netWorth += isLiability ? -Math.abs(a.balance) : a.balance;
    }
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
    <div className="p-8 overflow-y-auto flex-1 max-w-5xl mx-auto w-full space-y-10">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-fg">Dashboard</h1>
        <p className="text-sm text-fg-2 mt-0.5">Week of {weekLabel}</p>
      </div>

      {/* ── TODAY ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Today" color="bg-sky-400" />
        <WeatherWidget />
      </section>

      {/* ── AT A GLANCE ──────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="At a Glance" color="bg-indigo-400" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Net Worth",
              value: netWorth === 0 ? "—" : (Math.abs(netWorth) >= 1_000_000
                ? `$${(Math.abs(netWorth) / 1_000_000).toFixed(1)}M`
                : Math.abs(netWorth) >= 1000
                  ? `$${(Math.abs(netWorth) / 1000).toFixed(0)}k`
                  : `$${Math.abs(netWorth).toFixed(0)}`),
              color: netWorth >= 0 ? "text-emerald-400" : "text-red-400",
              sub: netWorth === 0 ? "add accounts" : netWorth >= 0 ? "positive net worth" : "negative net worth",
              icon: "💰",
            },
            {
              label: "Workouts",
              value: `${weekWorkoutCount}`,
              color: weekWorkoutCount >= 3 ? "text-teal-400" : weekWorkoutCount > 0 ? "text-fg-2" : "text-fg-3",
              sub: weekWorkoutCount === 1 ? "session this week" : "sessions this week",
              icon: "🏋️",
            },
            {
              label: "Tasks",
              value: `${openTaskCount}`,
              color: overdueCount > 0 ? "text-red-400" : openTaskCount > 0 ? "text-fg-2" : "text-emerald-400",
              sub: overdueCount > 0 ? `${overdueCount} overdue` : openTaskCount === 0 ? "all clear" : "open tasks",
              icon: "✅",
            },
            {
              label: "Next Event",
              value: nextEvent
                ? nextEvent.startTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "—",
              color: "text-blue-400",
              sub: nextEvent ? nextEvent.title : "nothing scheduled",
              icon: "📅",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-raised border border-surface-border rounded-xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{stat.icon}</span>
                <p className="text-xs text-fg-3">{stat.label}</p>
              </div>
              <p className={`text-2xl font-bold leading-tight ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-fg-3 truncate">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── THIS WEEK ────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="This Week" color="bg-blue-400" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Schedule */}
          <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-fg">📅 Schedule</h2>
              <span className="text-xs text-fg-3">{events.length} event{events.length !== 1 ? "s" : ""}</span>
            </div>
            {events.length === 0 ? (
              <p className="text-xs text-fg-3 text-center py-8">No events this week.</p>
            ) : (
              <div className="space-y-4">
                {sortedDays.map(([dateKey, dayEvents]) => (
                  <div key={dateKey}>
                    <p className="text-[11px] font-bold text-fg-3 uppercase tracking-[0.1em] mb-1.5">
                      {formatDay(dateKey + "T12:00:00")}
                    </p>
                    <div className="space-y-1.5">
                      {dayEvents.map((ev) => {
                        const cat = CATEGORIES[ev.category as CategoryKey] ?? CATEGORIES.other;
                        return (
                          <div key={ev.id} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border ${cat.bg} ${cat.border}`}>
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cat.dot}`} />
                            <p className="text-sm font-medium text-fg truncate flex-1 min-w-0">{ev.title}</p>
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

          {/* Todos */}
          <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-fg">✅ Due This Week</h2>
              <span className="text-xs text-fg-3">{sortedTodos.length} task{sortedTodos.length !== 1 ? "s" : ""}</span>
            </div>
            {sortedTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm text-fg-2 font-medium">All clear this week</p>
                <p className="text-xs text-fg-3 mt-1">No tasks due before Sunday.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded border border-surface-border flex-shrink-0" />
                    <p className="text-sm text-fg truncate flex-1 min-w-0">{todo.title}</p>
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
      </section>

      {/* ── COUNTDOWNS ───────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Countdowns" color="bg-amber-400" />
        <CountdownWidget countdowns={countdowns} />
      </section>

      {/* ── LEARNING ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Learning" color="bg-violet-400" />
        <GREWords />
      </section>

    </div>
  );
}
