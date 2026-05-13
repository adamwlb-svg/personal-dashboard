"use client";

import { useState, useEffect } from "react";
import { THEMES, Theme, applyTheme, getStoredThemeId, storeThemeId } from "@/lib/themes";

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Customize the look and feel of your dashboard.</p>
      </div>

      {/* Theme picker */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-1">Color Theme</h2>
        <p className="text-xs text-gray-500 mb-5">Choose an accent color palette. Your selection is saved automatically.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEMES.map((theme) => {
            const isActive = theme.id === activeId;
            return (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme)}
                className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                  isActive
                    ? "border-white/40 scale-[1.02] shadow-lg"
                    : "border-transparent hover:border-white/20"
                }`}
              >
                {/* Mini dashboard preview */}
                <div
                  className="h-24 p-2 flex flex-col gap-1.5"
                  style={{ background: theme.surface }}
                >
                  {/* Fake sidebar strip */}
                  <div className="flex gap-1.5 h-full">
                    <div
                      className="w-6 rounded-md flex-shrink-0"
                      style={{ background: theme.surfaceRaised, border: `1px solid ${theme.surfaceBorder}` }}
                    >
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="mx-1 mt-1.5 h-1 rounded-full"
                          style={{
                            background: i === 0 ? theme.accent : theme.surfaceBorder,
                            opacity: i === 0 ? 1 : 0.5,
                          }}
                        />
                      ))}
                    </div>
                    {/* Fake content area */}
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex gap-1">
                        <div
                          className="flex-1 h-8 rounded-md"
                          style={{ background: theme.surfaceRaised, border: `1px solid ${theme.surfaceBorder}` }}
                        />
                        <div
                          className="w-8 h-8 rounded-md"
                          style={{ background: theme.accent }}
                        />
                      </div>
                      <div
                        className="h-3 rounded-md w-3/4"
                        style={{ background: theme.surfaceRaised, border: `1px solid ${theme.surfaceBorder}` }}
                      />
                      <div
                        className="h-3 rounded-md w-1/2"
                        style={{ background: theme.surfaceRaised, border: `1px solid ${theme.surfaceBorder}` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Label row */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ background: theme.surfaceRaised, borderTop: `1px solid ${theme.surfaceBorder}` }}
                >
                  <span className="text-xs font-medium text-gray-200">{theme.name}</span>
                  <div
                    className="w-3 h-3 rounded-full ring-1 ring-white/20"
                    style={{ background: theme.preview }}
                  />
                </div>

                {/* Active checkmark */}
                {isActive && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview strip */}
      <div className="bg-surface-raised border border-surface-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Live Preview</h2>
        <div className="flex flex-wrap gap-3 items-center">
          <button className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors">
            Primary Button
          </button>
          <button className="px-4 py-2 bg-surface border border-surface-border text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors">
            Secondary Button
          </button>
          <span className="text-xs bg-accent/10 border border-accent/20 text-accent px-3 py-1.5 rounded-full">
            Accent Badge
          </span>
          <span className="text-xs text-gray-500">Active theme: <span className="text-accent font-medium">{THEMES.find((t) => t.id === activeId)?.name}</span></span>
        </div>
      </div>
    </div>
  );
}
