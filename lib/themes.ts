export type Theme = {
  id: string;
  name: string;
  surface: string;
  surfaceRaised: string;
  surfaceBorder: string;
  accent: string;
  accentHover: string;
  preview: string; // accent swatch color for the visual picker
};

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
}

export function getStoredThemeId(): string {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  return localStorage.getItem("themeId") ?? DEFAULT_THEME_ID;
}

export function storeThemeId(id: string) {
  localStorage.setItem("themeId", id);
}
