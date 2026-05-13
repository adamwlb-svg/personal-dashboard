"use client";

import { useState, useEffect } from "react";
import { THEMES, Theme, applyTheme, getStoredThemeId, storeThemeId } from "@/lib/themes";

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
