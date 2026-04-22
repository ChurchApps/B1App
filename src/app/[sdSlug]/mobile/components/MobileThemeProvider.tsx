"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GlobalStyles } from "@mui/material";
import type { AppThemeConfig } from "@/helpers/ConfigHelper";

export type MobileThemeMode = "light" | "dark";

interface MobileThemeContextValue {
  mode: MobileThemeMode;
  toggle: () => void;
  setMode: (mode: MobileThemeMode) => void;
}

const STORAGE_KEY = "b1mobile.theme";

const MobileThemeContext = createContext<MobileThemeContextValue>({
  mode: "light",
  toggle: () => {},
  setMode: () => {}
});

export const useMobileThemeMode = () => useContext(MobileThemeContext);

const buildLightVars = (appTheme?: AppThemeConfig) => {
  const c = appTheme?.light;
  const primary = c?.primary || "#0D47A1";
  return {
    "--mb-primary": primary,
    "--mb-primary-light": `color-mix(in srgb, ${primary} 15%, #FFFFFF)`,
    "--mb-secondary": c?.secondary || "#568BDA",
    "--mb-background": c?.background || "#F6F6F8",
    "--mb-surface": c?.surface || "#FFFFFF",
    "--mb-surface-variant": "#F6F6F8",
    "--mb-text": c?.textColor || "#3c3c3c",
    "--mb-text-secondary": "#9E9E9E",
    "--mb-text-muted": "#666666",
    "--mb-text-hint": "#999999",
    "--mb-on-primary": c?.primaryContrast || "#FFFFFF",
    "--mb-success": "#70DC87",
    "--mb-warning": "#FEAA24",
    "--mb-error": "#B0120C",
    "--mb-border": "#F0F0F0",
    "--mb-border-light": "#E5E7EB",
    "--mb-divider": "#E0E0E0",
    "--mb-icon-background": "#F6F6F8",
    "--mb-disabled": "#BDBDBD"
  };
};

const buildDarkVars = (appTheme?: AppThemeConfig) => {
  const c = appTheme?.dark;
  const primary = c?.primary || "#4A90E2";
  return {
    "--mb-primary": primary,
    "--mb-primary-light": `color-mix(in srgb, ${primary} 25%, #000000)`,
    "--mb-secondary": c?.secondary || "#6BA4E8",
    "--mb-background": c?.background || "#121212",
    "--mb-surface": c?.surface || "#1E1E1E",
    "--mb-surface-variant": "#2D2D2D",
    "--mb-text": c?.textColor || "#E0E0E0",
    "--mb-text-secondary": "#AAAAAA",
    "--mb-text-muted": "#888888",
    "--mb-text-hint": "#777777",
    "--mb-on-primary": c?.primaryContrast || "#FFFFFF",
    "--mb-success": "#70DC87",
    "--mb-warning": "#FEAA24",
    "--mb-error": "#E57373",
    "--mb-border": "#333333",
    "--mb-border-light": "#2D2D2D",
    "--mb-divider": "#333333",
    "--mb-icon-background": "#2D2D2D",
    "--mb-disabled": "#555555"
  };
};

const darkInputStyles = {
  "html[data-mobile-theme=\"dark\"] .MuiInputBase-input": { color: "var(--mb-text)" },
  "html[data-mobile-theme=\"dark\"] .MuiInputBase-input::placeholder": { color: "var(--mb-text-hint)", opacity: 1 },
  "html[data-mobile-theme=\"dark\"] .MuiFormLabel-root": { color: "var(--mb-text-secondary)" },
  "html[data-mobile-theme=\"dark\"] .MuiFormLabel-root.Mui-focused": { color: "var(--mb-primary)" },
  "html[data-mobile-theme=\"dark\"] .MuiOutlinedInput-notchedOutline": { borderColor: "var(--mb-border)" },
  "html[data-mobile-theme=\"dark\"] .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--mb-border-light)" },
  "html[data-mobile-theme=\"dark\"] .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--mb-primary)" },
  "html[data-mobile-theme=\"dark\"] .MuiFilledInput-root": { backgroundColor: "var(--mb-surface-variant)" },
  "html[data-mobile-theme=\"dark\"] .MuiInput-underline:before": { borderBottomColor: "var(--mb-border)" },
  "html[data-mobile-theme=\"dark\"] .MuiSelect-icon": { color: "var(--mb-text-secondary)" },
  "html[data-mobile-theme=\"dark\"] .MuiFormHelperText-root": { color: "var(--mb-text-secondary)" }
};

export const MobileThemeProvider: React.FC<{ children: React.ReactNode; appTheme?: AppThemeConfig }> = ({ children, appTheme }) => {
  const [mode, setModeState] = useState<MobileThemeMode>("light");

  const globalStyles = useMemo(() => (
    <GlobalStyles
      styles={{
        ":root": buildLightVars(appTheme),
        'html[data-mobile-theme="dark"]': { ...buildDarkVars(appTheme), colorScheme: "dark" },

        "body": { margin: 0 },
        ...darkInputStyles
      }}
    />
  ), [appTheme]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") setModeState(stored);
    } catch { }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-mobile-theme", mode);
    return () => { document.documentElement.removeAttribute("data-mobile-theme"); };
  }, [mode]);

  const setMode = useCallback((next: MobileThemeMode) => {
    setModeState(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { }
  }, []);

  const toggle = useCallback(() => {
    setModeState(prev => {
      const next: MobileThemeMode = prev === "light" ? "dark" : "light";
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { }
      return next;
    });
  }, []);

  const value = useMemo<MobileThemeContextValue>(() => ({ mode, toggle, setMode }), [mode, toggle, setMode]);

  return (
    <MobileThemeContext.Provider value={value}>
      {globalStyles}
      {children}
    </MobileThemeContext.Provider>
  );
};
