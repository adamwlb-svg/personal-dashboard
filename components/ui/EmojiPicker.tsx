"use client";

import { useState, useRef, useEffect } from "react";

const EMOJIS = [
  // Events / calendar
  "📅","🗓️","⏰","🔔","📌","🎯","⭐","🌟",
  // Work
  "💼","📊","💻","📝","📧","📞","🤝","📋",
  // Social
  "🎉","🍽️","☕","🎂","🎊","🥂","🎁","🎈",
  // Health / fitness
  "🏃","🧘","💊","🏋️","🍎","💪","🥗","😴",
  // Travel
  "✈️","🚗","🏨","🌍","🗺️","🚂","⛵","🏕️",
  // Home
  "🏠","🛒","🔧","🧹","🛋️","🌿","🐾","🔑",
  // Finance
  "💰","💳","📈","🏦","💵","📉","🪙","💹",
  // Learning / misc
  "📚","🎓","💡","🔖","🎵","🎬","🏆","🎮",
  // Nature / mood
  "🌈","🌸","🔥","❤️","✅","⚡","🌊","🎨",
];

type Props = {
  value: string;
  onChange: (emoji: string) => void;
};

export function EmojiPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={value ? "Change emoji" : "Add emoji"}
        className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors text-lg
          ${open ? "border-accent bg-accent/10" : "border-surface-border bg-surface hover:border-gray-500"}
          ${!value ? "text-fg-4" : ""}`}
      >
        {value || "😀"}
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 bg-surface-raised border border-surface-border rounded-xl shadow-xl p-2 w-64">
          <div className="grid grid-cols-8 gap-0.5">
            {/* Clear option */}
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              title="No emoji"
              className="w-7 h-7 flex items-center justify-center rounded text-xs text-fg-4 hover:bg-white/10 transition-colors border border-surface-border"
            >
              ✕
            </button>
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => { onChange(e); setOpen(false); }}
                className={`w-7 h-7 flex items-center justify-center rounded text-base hover:bg-white/10 transition-colors
                  ${value === e ? "bg-accent/20 ring-1 ring-accent/50" : ""}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
