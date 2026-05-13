"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { METRIC_TYPES, MetricType, SerializedMetric, getSparklineValues, getLatest } from "@/lib/health";
import { logMetric } from "@/app/health/actions";

function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2) return <div className="h-8 w-20" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 80, H = 32;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} className={`overflow-visible ${className ?? ""}`}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Props = {
  type: MetricType;
  metrics: SerializedMetric[];
};

export function MetricCard({ type, metrics }: Props) {
  const router = useRouter();
  const meta = METRIC_TYPES[type];
  const latest = getLatest(metrics, type);
  const sparkValues = getSparklineValues(metrics, type);
  const [logging, setLogging] = useState(false);
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(value);
    if (isNaN(num)) return;
    setSaving(true);
    await logMetric({ type, value: num, unit: meta.unit, notes: notes || undefined });
    setValue("");
    setNotes("");
    setSaving(false);
    setLogging(false);
    router.refresh();
  }

  const prev = metrics.filter((m) => m.type === type).slice(-2)[0];
  const delta = latest && prev && prev.id !== latest.id ? latest.value - prev.value : null;

  return (
    <div className={`bg-surface-raised border rounded-xl p-4 flex flex-col gap-3 ${meta.border}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fg-2 flex items-center gap-1.5">
          <span>{meta.icon}</span> {meta.label}
        </span>
        <button
          onClick={() => setLogging((v) => !v)}
          className={`text-xs px-2 py-1 rounded-lg border transition-colors
            ${logging ? "bg-surface border-surface-border text-fg-2" : `${meta.bg} ${meta.border} ${meta.color}`}`}
        >
          {logging ? "Cancel" : "+ Log"}
        </button>
      </div>

      {/* Value + sparkline */}
      <div className="flex items-end justify-between">
        <div>
          {latest ? (
            <>
              <p className={`text-2xl font-semibold ${meta.color}`}>
                {latest.value}
                <span className="text-sm font-normal text-fg-3 ml-1">{meta.unit}</span>
              </p>
              {delta !== null && (
                <p className={`text-xs mt-0.5 ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-fg-3"}`}>
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)} from last entry
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-fg-3">No data yet</p>
          )}
        </div>
        <div className={meta.color}>
          <Sparkline values={sparkValues} />
        </div>
      </div>

      {/* Inline log form */}
      {logging && (
        <form onSubmit={handleLog} className="flex flex-col gap-2 pt-1 border-t border-surface-border">
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder={`Value (${meta.unit})`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
              required
              className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-sm text-fg placeholder-gray-500 focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-fg text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "…" : "Save"}
            </button>
          </div>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-sm text-fg placeholder-gray-500 focus:outline-none focus:border-accent"
          />
        </form>
      )}
    </div>
  );
}
