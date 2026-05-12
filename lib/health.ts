export const METRIC_TYPES = {
  weight:      { label: "Weight",      unit: "lbs",  icon: "⚖️",  color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  sleep:       { label: "Sleep",       unit: "hrs",  icon: "🌙",  color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
  exercise:    { label: "Exercise",    unit: "min",  icon: "🏃",  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  calories:    { label: "Calories",    unit: "cal",  icon: "🔥",  color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
  supplements: { label: "Supplements", unit: "dose", icon: "💊",  color: "text-pink-400",    bg: "bg-pink-500/10",    border: "border-pink-500/20" },
} as const;

export type MetricType = keyof typeof METRIC_TYPES;

export type SerializedMetric = {
  id: number;
  type: string;
  value: number;
  unit: string;
  notes: string | null;
  loggedAt: string;
};

export type SerializedChatMessage = {
  id: number;
  role: string;
  content: string;
  createdAt: string;
};

export type SerializedAppointment = {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  allDay: boolean;
};

// Returns last N values for a given metric type, ordered oldest→newest
export function getSparklineValues(metrics: SerializedMetric[], type: string, n = 7): number[] {
  return metrics
    .filter((m) => m.type === type)
    .slice(-n)
    .map((m) => m.value);
}

// Returns the most recent metric of a given type
export function getLatest(metrics: SerializedMetric[], type: string): SerializedMetric | null {
  const filtered = metrics.filter((m) => m.type === type);
  return filtered.length > 0 ? filtered[filtered.length - 1] : null;
}

// Returns today's total for additive metrics (water, exercise, calories)
export function getTodayTotal(metrics: SerializedMetric[], type: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return metrics
    .filter((m) => m.type === type && new Date(m.loggedAt) >= today)
    .reduce((sum, m) => sum + m.value, 0);
}
