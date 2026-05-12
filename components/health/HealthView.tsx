"use client";

import { SerializedMetric, SerializedChatMessage, SerializedAppointment, METRIC_TYPES, MetricType, getTodayTotal } from "@/lib/health";
import { AppointmentsCard } from "./AppointmentsCard";
import { MetricCard } from "./MetricCard";
import { HealthChat } from "./HealthChat";

type Props = {
  appointments: SerializedAppointment[];
  metrics: SerializedMetric[];
  chatMessages: SerializedChatMessage[];
  aiConfigured: boolean;
};

const METRIC_ORDER: MetricType[] = ["weight", "sleep", "exercise", "calories", "supplements"];

export function HealthView({ appointments, metrics, chatMessages, aiConfigured }: Props) {
  const todayExercise    = getTodayTotal(metrics, "exercise");
  const todayCalories    = getTodayTotal(metrics, "calories");
  const todaySupplements = getTodayTotal(metrics, "supplements");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Health</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track your wellbeing and appointments.</p>
      </div>

      {/* Top row: Appointments + Today snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AppointmentsCard appointments={appointments} />

        {/* Today snapshot */}
        <div className="bg-surface-raised border border-surface-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">📊 Today&apos;s Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Exercise",    value: todayExercise,    unit: "min",  color: "text-emerald-400" },
              { label: "Calories",    value: todayCalories,    unit: "cal",  color: "text-orange-400" },
              { label: "Supplements", value: todaySupplements, unit: "doses", color: "text-pink-400" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-xl font-semibold ${item.color}`}>
                  {item.value > 0 ? item.value.toFixed(item.value % 1 === 0 ? 0 : 1) : "—"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                {item.value > 0 && <p className="text-xs text-gray-600">{item.unit}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {METRIC_ORDER.map((type) => (
            <MetricCard key={type} type={type} metrics={metrics} />
          ))}
        </div>
      </div>

      {/* Health chat */}
      <div>
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">AI Assistant</h2>
        <HealthChat initialMessages={chatMessages} aiConfigured={aiConfigured} />
      </div>
    </div>
  );
}
