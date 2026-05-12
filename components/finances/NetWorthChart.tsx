"use client";

import { NetWorthPoint, formatCurrency } from "@/lib/finance";

type Props = {
  data: NetWorthPoint[];
};

export function NetWorthChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-gray-600">
        Add more accounts and update balances to see your net worth trend.
      </div>
    );
  }

  const W = 600;
  const H = 100;
  const PAD = { top: 8, right: 4, bottom: 20, left: 4 };

  const values = data.map((d) => d.netWorth);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right);
  const toY = (v: number) => PAD.top + (1 - (v - min) / range) * (H - PAD.top - PAD.bottom);

  const points = data.map((d, i) => `${toX(i)},${toY(d.netWorth)}`).join(" ");
  const firstX = toX(0);
  const lastX = toX(data.length - 1);
  const baseline = H - PAD.bottom;

  const areaPath = `M ${firstX},${baseline} L ${points.split(" ").map((p, i) => (i === 0 ? p : p)).join(" L ")} L ${lastX},${baseline} Z`;
  const polyline = points;

  // Label every N-th date
  const labelCount = Math.min(data.length, 5);
  const step = Math.floor((data.length - 1) / (labelCount - 1));
  const labelIndices = Array.from({ length: labelCount }, (_, i) =>
    i === labelCount - 1 ? data.length - 1 : i * step
  );

  const isPositive = data[data.length - 1].netWorth >= (data[0]?.netWorth ?? 0);
  const lineColor = isPositive ? "#34d399" : "#f87171";
  const fillId = `nw-fill-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 100 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <path d={areaPath} fill={`url(#${fillId})`} />
        {/* Line */}
        <polyline points={polyline} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Current value dot */}
        <circle cx={lastX} cy={toY(data[data.length - 1].netWorth)} r="3" fill={lineColor} />
        {/* Date labels */}
        {labelIndices.map((idx) => (
          <text
            key={idx}
            x={toX(idx)}
            y={H - 4}
            textAnchor={idx === 0 ? "start" : idx === data.length - 1 ? "end" : "middle"}
            fill="#6b7280"
            fontSize="8"
            fontFamily="sans-serif"
          >
            {new Date(data[idx].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
        ))}
      </svg>
      {/* Min / Max callouts */}
      <div className="flex items-center justify-between text-xs text-gray-600 mt-0.5 px-0.5">
        <span>{formatCurrency(min, true)}</span>
        <span>{formatCurrency(max, true)}</span>
      </div>
    </div>
  );
}
