"use client";

import { useState, useEffect } from "react";
import { THEMES, Theme, applyTheme, getStoredThemeId, storeThemeId } from "@/lib/themes";

const EXPORTS = [
  { section: "tasks",       label: "Tasks",               emoji: "✅" },
  { section: "events",      label: "Calendar Events",     emoji: "📅" },
  { section: "workouts",    label: "Workouts",            emoji: "🏋️" },
  { section: "supplements", label: "Supplements",         emoji: "💊" },
  { section: "expenses",    label: "Recurring Expenses",  emoji: "🔄" },
  { section: "accounts",    label: "Financial Accounts",  emoji: "🏦" },
  { section: "budget",      label: "Budget Entries",      emoji: "📊" },
];

function ExportButton({ section, label, emoji }: { section: string; label: string; emoji: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export?section=${section}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${section}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center justify-between px-4 py-3 bg-surface border border-surface-border rounded-xl hover:border-gray-600 transition-colors disabled:opacity-50 group"
    >
      <div className="flex items-center gap-3">
        <span className="text-base">{emoji}</span>
        <span className="text-sm text-fg-2 group-hover:text-fg transition-colors">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-fg-3">
        {loading ? (
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </>
        )}
      </div>
    </button>
  );
}

const darkThemes = THEMES.filter((t) => t.isDark);
const lightThemes = THEMES.filter((t) => !t.isDark);

function ThemeCard({ theme, isActive, onSelect }: { theme: Theme; isActive: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`relative rounded-xl border-2 overflow-hidden transition-all ${
        isActive
          ? "border-white/40 scale-[1.02] shadow-lg"
          : "border-transparent hover:border-white/20"
      }`}
      style={isActive ? { borderColor: theme.accent + "99" } : undefined}
    >
      {/* Mini dashboard preview */}
      <div className="h-24 p-2 flex gap-1.5" style={{ background: theme.surface }}>
        {/* Fake sidebar */}
        <div
          className="w-6 rounded-md flex-shrink-0 pt-1.5 space-y-1.5 px-1"
          style={{ background: theme.surfaceRaised, border: `1px solid ${theme.surfaceBorder}` }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-1 rounded-full"
              style={{ background: i === 0 ? theme.accent : theme.surfaceBorder }}
            />
          ))}
        </div>
        {/* Fake content */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex gap-1">
            <div
              className="flex-1 h-8 rounded-md"
              style={{ background: theme.surfaceRaised, border: `1px solid ${theme.surfaceBorder}` }}
            />
            <div className="w-8 h-8 rounded-md" style={{ background: theme.accent }} />
          </div>
          <div className="h-2.5 rounded w-3/4" style={{ background: theme.surfaceRaised, border: `1px solid ${theme.surfaceBorder}` }} />
          <div className="h-2.5 rounded w-1/2" style={{ background: theme.surfaceRaised, border: `1px solid ${theme.surfaceBorder}` }} />
        </div>
      </div>

      {/* Label */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ background: theme.surfaceRaised, borderTop: `1px solid ${theme.surfaceBorder}` }}
      >
        <span className="text-xs font-medium" style={{ color: theme.fg }}>{theme.name}</span>
        <div className="w-3 h-3 rounded-full ring-1 ring-black/10" style={{ background: theme.preview }} />
      </div>

      {/* Active checkmark */}
      {isActive && (
        <div
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: theme.accent }}
        >
          <svg className="w-3 h-3 text-gray-900" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

export function SettingsView() {
  const [activeId, setActiveId] = useState<string>(getStoredThemeId());

  useEffect(() => {
    setActiveId(getStoredThemeId());
  }, []);

  function selectTheme(theme: Theme) {
    applyTheme(theme);
    storeThemeId(theme.id);
    setActiveId(theme.id);
  }

  const activeTheme = THEMES.find((t) => t.id === activeId) ?? THEMES[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-fg">Settings</h1>
        <p className="text-sm text-fg-3 mt-0.5">Customize the look and feel of your dashboard.</p>
      </div>

      {/* Theme picker */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-fg mb-1">Color Theme</h2>
          <p className="text-xs text-fg-3">Choose a palette. Your selection is saved automatically.</p>
        </div>

        {/* Dark themes */}
        <div>
          <p className="text-xs font-medium text-fg-3 uppercase tracking-wider mb-3">Dark</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {darkThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={theme.id === activeId}
                onSelect={() => selectTheme(theme)}
              />
            ))}
          </div>
        </div>

        {/* Light themes */}
        <div>
          <p className="text-xs font-medium text-fg-3 uppercase tracking-wider mb-3">Light</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {lightThemes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                isActive={theme.id === activeId}
                onSelect={() => selectTheme(theme)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Data export */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-fg mb-1">Data Export</h2>
          <p className="text-xs text-fg-3">Download any section of your data as a CSV file.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXPORTS.map((e) => (
            <ExportButton key={e.section} {...e} />
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-fg mb-4">Live Preview</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <button className="px-4 py-2 bg-accent hover:bg-accent-hover text-fg text-sm font-medium rounded-lg transition-colors">
            Primary Button
          </button>
          <button className="px-4 py-2 bg-surface border border-surface-border text-fg-2 hover:text-fg text-sm font-medium rounded-lg transition-colors">
            Secondary Button
          </button>
          <span className="text-xs bg-accent/10 border border-accent/20 text-accent px-3 py-1.5 rounded-full">
            Accent Badge
          </span>
          <span className="text-xs text-fg-3">
            Active: <span className="font-medium" style={{ color: activeTheme.accent }}>{activeTheme.name}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
