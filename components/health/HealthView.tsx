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

type Props = {
  appointments: SerializedAppointment[];
  metrics: SerializedMetric[];
  supplements: SerializedSupplementEntry[];
  dailyStack: SerializedDailySupplement[];
  workouts: SerializedWorkout[];
  todos: SerializedFinanceTodo[];
  chatMessages: SerializedChatMessage[];
  aiConfigured: boolean;
};

// Only weight remains — sleep and calories removed per user request
const METRIC_ORDER: MetricType[] = ["weight"];

export function HealthView({
  appointments, metrics, supplements, dailyStack, workouts, todos, chatMessages, aiConfigured,
}: Props) {
  const todaySupplements = getTodaySupplements(supplements);
  const weekWorkouts = getWeekWorkouts(workouts, getWeekStart(new Date()));
  const weekMinutes = weekWorkouts.reduce((s, w) => s + w.minutes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Health</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track your wellbeing and appointments.</p>
      </div>

      {/* 1. Appointments + Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AppointmentsCard appointments={appointments} />

        <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">📊 Snapshot</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Exercise",    value: weekMinutes > 0 ? `${weekMinutes} min` : null, sub: "this week",  color: "text-emerald-400" },
              { label: "Supplements", value: todaySupplements.length > 0 ? `${todaySupplements.length}` : null, sub: "today", color: "text-pink-400" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-2xl font-semibold ${item.color}`}>{item.value ?? "—"}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                {item.value && <p className="text-xs text-gray-600">{item.sub}</p>}
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
      </div>

      {/* 2. Health To-Dos */}
      <HealthTodos todos={todos} />

      {/* 3. Wearable Sync */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span>⌚</span> Wearable Sync
          </h3>
          <span className="text-xs text-gray-600 bg-surface px-2 py-0.5 rounded-full border border-surface-border">
            Coming Soon
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
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
                <p className="text-xs font-medium text-gray-300">{item.label}</p>
                <p className="text-xs text-gray-600">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Metrics — weight only */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {METRIC_ORDER.map((type) => (
            <MetricCard key={type} type={type} metrics={metrics} />
          ))}
        </div>
      </div>

      {/* 5. Exercise (weekly) + Supplements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExerciseLog workouts={workouts} />
        <SupplementTracker supplements={supplements} dailyStack={dailyStack} />
      </div>

      {/* 6. AI Assistant */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">AI Assistant</h2>
          {aiConfigured && (
            <p className="text-xs text-gray-600">
              Say{" "}
              <span className="text-gray-400">&ldquo;ran 30 min&rdquo;</span> or{" "}
              <span className="text-gray-400">&ldquo;took Vitamin D 2000mg&rdquo;</span> to log automatically
            </p>
          )}
        </div>
        <HealthChat initialMessages={chatMessages} aiConfigured={aiConfigured} />
      </div>
    </div>
  );
}
