"use client";

import {
  SerializedMetric,
  SerializedSupplementEntry,
  SerializedDailySupplement,
  SerializedWorkout,
  SerializedChatMessage,
  SerializedAppointment,
  MetricType,
  getTodaySupplements,
  getWeekStart,
  getWeekWorkouts,
} from "@/lib/health";
import { SerializedFinanceTodo } from "@/lib/finance";
import { AppointmentsCard } from "./AppointmentsCard";
import { MetricCard } from "./MetricCard";
import { SupplementTracker } from "./SupplementTracker";
import { ExerciseLog } from "./ExerciseLog";
import { HealthTodos } from "./HealthTodos";
import { HealthChat } from "./HealthChat";
import { KeyContacts, SerializedContact } from "./KeyContacts";

type Props = {
  appointments: SerializedAppointment[];
  metrics: SerializedMetric[];
  supplements: SerializedSupplementEntry[];
  dailyStack: SerializedDailySupplement[];
  workouts: SerializedWorkout[];
  todos: SerializedFinanceTodo[];
  chatMessages: SerializedChatMessage[];
  aiConfigured: boolean;
  contacts: SerializedContact[];
};

const METRIC_ORDER: MetricType[] = ["weight"];

function SectionDivider({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-1 h-4 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-fg-3 flex-shrink-0">{label}</span>
      <div className="flex-1 h-px bg-surface-border" />
    </div>
  );
}

export function HealthView({
  appointments, metrics, supplements, dailyStack, workouts, todos, chatMessages, aiConfigured, contacts,
}: Props) {
  const todaySupplements = getTodaySupplements(supplements);
  const weekWorkouts = getWeekWorkouts(workouts, getWeekStart(new Date()));
  const weekMinutes = weekWorkouts.reduce((s, w) => s + w.minutes, 0);

  return (
    <div className="space-y-10">

      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-fg">Health</h1>
        <p className="text-sm text-fg-2 mt-0.5">Track your wellbeing, habits, and care providers.</p>
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Overview" color="bg-teal-400" />

        {/* Snapshot stats */}
        <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-fg mb-4">📊 At a Glance</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Exercise",    value: weekMinutes > 0 ? `${weekMinutes} min` : null, sub: "this week",  color: "text-emerald-400" },
              { label: "Supplements", value: todaySupplements.length > 0 ? `${todaySupplements.length}` : null, sub: "logged today", color: "text-pink-400" },
            ].map((item) => (
              <div key={item.label} className="text-center py-2">
                <p className={`text-3xl font-bold ${item.color}`}>{item.value ?? "—"}</p>
                <p className="text-xs font-medium text-fg-2 mt-1">{item.label}</p>
                {item.value && <p className="text-xs text-fg-3">{item.sub}</p>}
              </div>
            ))}
          </div>
          {todaySupplements.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-surface-border">
              {todaySupplements.map((s) => (
                <span key={s.id} className="text-xs bg-pink-500/10 border border-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full">
                  {s.name}{s.amount > 0 ? ` ${s.amount % 1 === 0 ? s.amount.toFixed(0) : s.amount}${s.unit}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Weight metric */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {METRIC_ORDER.map((type) => (
            <MetricCard key={type} type={type} metrics={metrics} />
          ))}
        </div>
      </section>

      {/* ── APPOINTMENTS & CARE ──────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Appointments & Care" color="bg-blue-400" />
        <AppointmentsCard appointments={appointments} />
        <KeyContacts contacts={contacts} />
      </section>

      {/* ── DAILY TRACKING ───────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Daily Tracking" color="bg-violet-400" />
        <HealthTodos todos={todos} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ExerciseLog workouts={workouts} />
          <SupplementTracker supplements={supplements} dailyStack={dailyStack} />
        </div>
      </section>

      {/* ── TOOLS ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionDivider label="Tools" color="bg-slate-400" />

        {/* Wearable Sync */}
        <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
              <span>⌚</span> Wearable Sync
            </h3>
            <span className="text-xs text-fg-3 bg-surface px-2 py-0.5 rounded-full border border-surface-border">
              Coming Soon
            </span>
          </div>
          <p className="text-xs text-fg-3 leading-relaxed mb-4">
            Automatically sync steps, heart rate, sleep stages, and workouts from your Fitbit Charge 6.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "👣", label: "Steps",        sub: "Daily step count" },
              { icon: "❤️", label: "Heart Rate",   sub: "Resting + zones" },
              { icon: "🌙", label: "Sleep Stages", sub: "Deep, REM, light" },
              { icon: "🏋️", label: "Workouts",     sub: "Auto-detected" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 opacity-40">
                <span className="text-base">{item.icon}</span>
                <div>
                  <p className="text-xs font-medium text-fg-2">{item.label}</p>
                  <p className="text-xs text-fg-3">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Assistant */}
        <div>
          {aiConfigured && (
            <p className="text-xs text-fg-3 mb-3">
              Say <span className="text-fg-2">&ldquo;ran 30 min&rdquo;</span> or{" "}
              <span className="text-fg-2">&ldquo;took Vitamin D 2000mg&rdquo;</span> to log automatically.
            </p>
          )}
          <HealthChat initialMessages={chatMessages} aiConfigured={aiConfigured} />
        </div>
      </section>

    </div>
  );
}
