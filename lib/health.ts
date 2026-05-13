export const METRIC_TYPES = {
  weight:   { label: "Weight",   unit: "lbs", icon: "⚖️", color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20" },
  sleep:    { label: "Sleep",    unit: "hrs", icon: "🌙", color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20" },
  calories: { label: "Calories", unit: "cal", icon: "🔥", color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20" },
} as const;

export type MetricType = keyof typeof METRIC_TYPES;

export const SUPPLEMENT_UNITS = ["mg", "g", "mcg", "IU", "ml", "capsule", "tablet", "gummy", "scoop"] as const;
export type SupplementUnit = (typeof SUPPLEMENT_UNITS)[number];

export const COMMON_SUPPLEMENTS = [
  "Vitamin D", "Omega-3", "Magnesium", "Zinc", "Vitamin C",
  "Vitamin B12", "Iron", "Calcium", "Creatine", "Ashwagandha",
  "Collagen", "Probiotics", "Melatonin", "CoQ10", "Turmeric",
];

export type SerializedMetric = {
  id: number;
  type: string;
  value: number;
  unit: string;
  notes: string | null;
  loggedAt: string;
};

export type SerializedSupplementEntry = {
  id: number;
  name: string;
  amount: number;
  unit: string;
  notes: string | null;
  loggedAt: string;
};

export type SerializedDailySupplement = {
  id: number;
  name: string;
  amount: number;
  unit: string;
  isActive: boolean;
  sortOrder: number;
};

export type SerializedWorkout = {
  id: number;
  activity: string;
  minutes: number;
  notes: string | null;
  loggedAt: string;
};

export const COMMON_ACTIVITIES = [
  "Run", "Walk", "Cycle", "Swim", "Gym", "Yoga",
  "Pilates", "HIIT", "Tennis", "Basketball", "Hike", "Stretch",
];

// Returns the Monday of the week containing `date`
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekWorkouts(workouts: SerializedWorkout[], weekStart: Date): SerializedWorkout[] {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);
  return workouts.filter((w) => {
    const local = localDate(w.loggedAt);
    return local >= weekStart && local < end;
  });
}

// Parse an ISO date string as local midnight to avoid UTC offset shifting the day
export function localDate(isoString: string): Date {
  const [y, m, d] = isoString.substring(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

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

export function getSparklineValues(metrics: SerializedMetric[], type: string, n = 7): number[] {
  return metrics.filter((m) => m.type === type).slice(-n).map((m) => m.value);
}

export function getLatest(metrics: SerializedMetric[], type: string): SerializedMetric | null {
  const filtered = metrics.filter((m) => m.type === type);
  return filtered.length > 0 ? filtered[filtered.length - 1] : null;
}

export function getTodayTotal(metrics: SerializedMetric[], type: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return metrics
    .filter((m) => m.type === type && new Date(m.loggedAt) >= today)
    .reduce((sum, m) => sum + m.value, 0);
}

export function getTodaySupplements(supplements: SerializedSupplementEntry[]): SerializedSupplementEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return supplements.filter((s) => new Date(s.loggedAt) >= today);
}
