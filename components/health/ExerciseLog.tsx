"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SerializedWorkout,
  COMMON_ACTIVITIES,
  getWeekStart,
  getWeekWorkouts,
  localDate,
} from "@/lib/health";
import { logWorkout, deleteWorkout } from "@/app/health/actions";

type Props = {
  workouts: SerializedWorkout[];
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ExerciseLog({ workouts }: Props) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [activity, setActivity] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [logDate, setLogDate] = useState(new Date().toISOString().substring(0, 10));
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const now = new Date();
  const baseWeekStart = getWeekStart(now);
  const weekStart = new Date(baseWeekStart);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekWorkouts = getWeekWorkouts(workouts, weekStart);
  const totalMinutes = weekWorkouts.reduce((s, w) => s + w.minutes, 0);
  const isCurrentWeek = weekOffset === 0;

  const suggestions = activity.length > 0
    ? COMMON_ACTIVITIES.filter(
        (a) => a.toLowerCase().includes(activity.toLowerCase()) && a.toLowerCase() !== activity.toLowerCase()
      )
    : [];

  // Group workouts by day of week
  const byDay: Record<number, SerializedWorkout[]> = {};
  for (const w of weekWorkouts) {
    const d = localDate(w.loggedAt); // parse as local date to avoid UTC offset shifting the day
    const js = d.getDay();
    const dayIdx = js === 0 ? 6 : js - 1;
    if (!byDay[dayIdx]) byDay[dayIdx] = [];
    byDay[dayIdx].push(w);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(minutes);
    if (!activity.trim() || isNaN(mins) || mins <= 0) return;
    setSaving(true);
    await logWorkout({ activity: activity.trim(), minutes: mins, notes: notes.trim() || undefined, loggedAt: logDate });
    setActivity(""); setMinutes(""); setNotes("");
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: number) {
    await deleteWorkout(id);
    router.refresh();
  }

  const formatWeekRange = () => {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${weekStart.toLocaleDateString("en-US", opts)} – ${weekEnd.toLocaleDateString("en-US", opts)}`;
  };

  return (
    <div className="bg-surface-raised border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400 flex items-center gap-1.5">
          <span>🏃</span> Exercise
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${totalMinutes > 0 ? "text-emerald-400" : "text-gray-600"}`}>
            {totalMinutes > 0 ? `${totalMinutes} min` : "—"}
          </span>
          <span className="text-xs text-gray-600">this week</span>
        </div>
      </div>

      {/* Week navigator */}
      <div className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
        <button onClick={() => setWeekOffset((o) => o - 1)}
          className="text-gray-500 hover:text-gray-300 transition-colors p-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-xs font-medium text-gray-300">{isCurrentWeek ? "This Week" : weekOffset === -1 ? "Last Week" : "Week of"}</p>
          <p className="text-xs text-gray-500">{formatWeekRange()}</p>
        </div>
        <button onClick={() => setWeekOffset((o) => Math.min(0, o + 1))}
          disabled={isCurrentWeek}
          className="text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-30 p-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-by-day view */}
      <div className="space-y-1">
        {DAYS.map((day, idx) => {
          const dayWorkouts = byDay[idx] ?? [];
          return (
            <div key={day} className="flex items-start gap-2 min-h-[28px]">
              <span className={`text-xs w-8 flex-shrink-0 mt-1.5 ${dayWorkouts.length > 0 ? "text-gray-400" : "text-gray-700"}`}>
                {day}
              </span>
              <div className="flex-1 flex flex-wrap gap-1 py-0.5">
                {dayWorkouts.length === 0 ? (
                  <span className="text-xs text-gray-700 mt-1">—</span>
                ) : (
                  dayWorkouts.map((w) => (
                    <span key={w.id}
                      className="group relative inline-flex items-center gap-1 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      {w.activity} · {w.minutes}m
                      <button onClick={() => handleDelete(w.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 text-emerald-600 hover:text-red-400">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex-shrink-0 w-12 text-right">
                {dayWorkouts.length > 0 && (
                  <span className="text-xs text-gray-600">
                    {dayWorkouts.reduce((s, w) => s + w.minutes, 0)}m
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add workout form (only for current week) */}
      {isCurrentWeek && (
        <form onSubmit={handleAdd} className="border-t border-surface-border pt-3 space-y-2">
          <div className="relative">
            <input type="text" placeholder="Activity (e.g. Run, Gym, Yoga)…" value={activity}
              onChange={(e) => { setActivity(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50" />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-raised border border-surface-border rounded-lg shadow-xl z-10 overflow-hidden">
                {suggestions.slice(0, 5).map((s) => (
                  <button key={s} type="button" onMouseDown={() => { setActivity(s); setShowSuggestions(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-surface hover:text-white transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative w-24">
              <input type="number" min="1" placeholder="Min" value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50" />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-600">min</span>
            </div>
            <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)}
              className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            <button type="submit" disabled={saving || !activity.trim() || !minutes}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? "…" : "Log"}
            </button>
          </div>
          <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50" />
        </form>
      )}
    </div>
  );
}
