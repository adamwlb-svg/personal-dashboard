export type Theme = {
  id: string;
  name: string;
  isDark: boolean;
  surface: string;
  surfaceRaised: string;
  surfaceBorder: string;
  accent: string;
  accentHover: string;
  preview: string;
  fg: string;       // primary text (white / near-black)
  fg2: string;      // secondary text
  fg3: string;      // muted text
  fg4: string;      // barely-visible / disabled text
};

// ── Dark themes ───────────────────────────────────────────────────────────────

const DARK_FG = { fg: "#ffffff", fg2: "#9ca3af", fg3: "#6b7280", fg4: "#374151", isDark: true };

export const THEMES: Theme[] = [
  {
    id: "midnight",
    name: "Midnight",
    surface: "#0f1117",
    surfaceRaised: "#1a1d27",
    surfaceBorder: "#2a2d3a",
    accent: "#6366f1",
    accentHover: "#4f46e5",
    preview: "#6366f1",
    ...DARK_FG,
  },
  {
    id: "ocean",
    name: "Ocean",
    surface: "#0a1628",
    surfaceRaised: "#0d1e38",
    surfaceBorder: "#183050",
    accent: "#0ea5e9",
    accentHover: "#0284c7",
    preview: "#0ea5e9",
    ...DARK_FG,
  },
  {
    id: "forest",
    name: "Forest",
    surface: "#0a180e",
    surfaceRaised: "#0f2218",
    surfaceBorder: "#1a3525",
    accent: "#22c55e",
    accentHover: "#16a34a",
    preview: "#22c55e",
    ...DARK_FG,
  },
  {
    id: "sunset",
    name: "Sunset",
    surface: "#1a0f0a",
    surfaceRaised: "#271810",
    surfaceBorder: "#3a2518",
    accent: "#f97316",
    accentHover: "#ea6c00",
    preview: "#f97316",
    ...DARK_FG,
  },
  {
    id: "rose",
    name: "Rose",
    surface: "#1a0f14",
    surfaceRaised: "#27101e",
    surfaceBorder: "#3a1a2a",
    accent: "#f43f5e",
    accentHover: "#e11d48",
    preview: "#f43f5e",
    ...DARK_FG,
  },
  {
    id: "violet",
    name: "Violet",
    surface: "#110f1a",
    surfaceRaised: "#1a1527",
    surfaceBorder: "#2a2040",
    accent: "#a855f7",
    accentHover: "#9333ea",
    preview: "#a855f7",
    ...DARK_FG,
  },
  {
    id: "gold",
    name: "Gold",
    surface: "#141008",
    surfaceRaised: "#1e1810",
    surfaceBorder: "#2e2518",
    accent: "#eab308",
    accentHover: "#ca8a04",
    preview: "#eab308",
    ...DARK_FG,
  },
  {
    id: "slate",
    name: "Slate",
    surface: "#0f1218",
    surfaceRaised: "#181d27",
    surfaceBorder: "#252b38",
    accent: "#94a3b8",
    accentHover: "#64748b",
    preview: "#94a3b8",
    ...DARK_FG,
  },

  // ── Light themes ──────────────────────────────────────────────────────────

  {
    id: "cloud",
    name: "Cloud",
    isDark: false,
    surface: "#f1f5f9",
    surfaceRaised: "#ffffff",
    surfaceBorder: "#e2e8f0",
    accent: "#6366f1",
    accentHover: "#4f46e5",
    preview: "#6366f1",
    fg: "#0f172a",
    fg2: "#334155",
    fg3: "#64748b",
    fg4: "#cbd5e1",
  },
  {
    id: "paper",
    name: "Paper",
    isDark: false,
    surface: "#faf7f2",
    surfaceRaised: "#ffffff",
    surfaceBorder: "#e8e0d4",
    accent: "#92400e",
    accentHover: "#78350f",
    preview: "#b45309",
    fg: "#1c1917",
    fg2: "#44403c",
    fg3: "#78716c",
    fg4: "#d6d3d1",
  },
  {
    id: "sky",
    name: "Sky",
    isDark: false,
    surface: "#eff6ff",
    surfaceRaised: "#ffffff",
    surfaceBorder: "#bfdbfe",
    accent: "#2563eb",
    accentHover: "#1d4ed8",
    preview: "#3b82f6",
    fg: "#1e3a5f",
    fg2: "#1e40af",
    fg3: "#60a5fa",
    fg4: "#bfdbfe",
  },
  {
    id: "mint",
    name: "Mint",
    isDark: false,
    surface: "#f0fdf4",
    surfaceRaised: "#ffffff",
    surfaceBorder: "#bbf7d0",
    accent: "#16a34a",
    accentHover: "#15803d",
    preview: "#22c55e",
    fg: "#14532d",
    fg2: "#166534",
    fg3: "#4ade80",
    fg4: "#bbf7d0",
  },
  {
    id: "blush",
    name: "Blush",
    isDark: false,
    surface: "#fff1f2",
    surfaceRaised: "#ffffff",
    surfaceBorder: "#fecdd3",
    accent: "#e11d48",
    accentHover: "#be123c",
    preview: "#f43f5e",
    fg: "#4c0519",
    fg2: "#9f1239",
    fg3: "#fb7185",
    fg4: "#fecdd3",
  },
];

export const DEFAULT_THEME_ID = "midnight";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--surface-raised", theme.surfaceRaised);
  root.style.setProperty("--surface-border", theme.surfaceBorder);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-hover", theme.accentHover);
  root.style.setProperty("--fg", theme.fg);
  root.style.setProperty("--fg-2", theme.fg2);
  root.style.setProperty("--fg-3", theme.fg3);
  root.style.setProperty("--fg-4", theme.fg4);
  // toggle dark class so Tailwind dark: variants still work
  root.classList.toggle("dark", theme.isDark);
}

export function getStoredThemeId(): string {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  return localStorage.getItem("themeId") ?? DEFAULT_THEME_ID;
}

export function storeThemeId(id: string) {
  localStorage.setItem("themeId", id);
}
