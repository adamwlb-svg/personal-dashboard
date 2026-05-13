"use client";

import { useEffect } from "react";
import { THEMES, applyTheme, getStoredThemeId } from "@/lib/themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const id = getStoredThemeId();
    const theme = THEMES.find((t) => t.id === id) ?? THEMES[0];
    applyTheme(theme);
  }, []);

  return <>{children}</>;
}
