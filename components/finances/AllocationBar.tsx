"use client";

import { AllocationSlice, formatCurrency } from "@/lib/finance";

type Props = {
  slices: AllocationSlice[];
  total: number;
};

export function AllocationBar({ slices, total }: Props) {
  if (slices.length === 0) {
    return <p className="text-xs text-fg-3 text-center py-6">No asset data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 w-full rounded-full overflow-hidden gap-px bg-surface">
        {slices.map((s) => (
          <div
            key={s.type}
            style={{ width: `${s.pct}%`, backgroundColor: s.chartColor }}
            className="transition-all"
            title={`${s.label}: ${formatCurrency(s.amount)}`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="space-y-1.5">
        {slices.map((s) => (
          <div key={s.type} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.chartColor }} />
              <span className="text-xs text-fg-2">{s.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-fg-3">{s.pct.toFixed(0)}%</span>
              <span className="text-xs font-medium text-fg-2 tabular-nums">{formatCurrency(s.amount, true)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-1 border-t border-surface-border flex items-center justify-between">
        <span className="text-xs text-fg-3">Total assets</span>
        <span className="text-xs font-semibold text-emerald-400">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}
