"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GlobalStyles } from "@mui/material";

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

// CSS variables are the single source of truth for mobile-shell colors. The
// `mobileTheme.colors.*` constants resolve to these var() references, so every
// consumer automatically picks up whichever palette is active.
const lightVars = {
  "--mb-primary": "#0D47A1",
  "--mb-primary-light": "#E3F2FD",
  "--mb-secondary": "#568BDA",
  "--mb-background": "#F6F6F8",
  "--mb-surface": "#FFFFFF",
  "--mb-surface-variant": "#F6F6F8",
  "--mb-text": "#3c3c3c",
  "--mb-text-secondary": "#9E9E9E",
  "--mb-text-muted": "#666666",
  "--mb-text-hint": "#999999",
  "--mb-on-primary": "#FFFFFF",
  "--mb-success": "#70DC87",
  "--mb-warning": "#FEAA24",
  "--mb-error": "#B0120C",
  "--mb-border": "#F0F0F0",
  "--mb-border-light": "#E5E7EB",
  "--mb-divider": "#E0E0E0",
  "--mb-icon-background": "#F6F6F8",
  "--mb-disabled": "#BDBDBD"
};

const darkVars = {
  "--mb-primary": "#4A90E2",
  "--mb-primary-light": "#1a3a5c",
  "--mb-secondary": "#6BA4E8",
  "--mb-background": "#121212",
  "--mb-surface": "#1E1E1E",
  "--mb-surface-variant": "#2D2D2D",
  "--mb-text": "#E0E0E0",
  "--mb-text-secondary": "#AAAAAA",
  "--mb-text-muted": "#888888",
  "--mb-text-hint": "#777777",
  "--mb-on-primary": "#FFFFFF",
  "--mb-success": "#70DC87",
  "--mb-warning": "#FEAA24",
  "--mb-error": "#E57373",
  "--mb-border": "#333333",
  "--mb-border-light": "#2D2D2D",
  "--mb-divider": "#333333",
  "--mb-icon-background": "#2D2D2D",
  "--mb-disabled": "#555555"
};

// Scope variables to `<html>` so MUI portals (Drawer, Modal, Menu) — which
// mount outside `.mobileAppRoot` — still resolve `var(--mb-*)` correctly.
// Light palette lives on `:root` as the fallback (used during SSR before the
// mount effect sets the data attribute) and as the explicit light mode.
// Dark-mode input overrides: MUI's default colors are baked into the
// Emotion-generated classes for `.MuiInputBase-input`, `.MuiInputLabel-root`
// etc. — they don't respond to CSS variables, so we have to restate them.
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

const mobileThemeGlobalStyles = (
  <GlobalStyles
    styles={{
      ":root": lightVars,
      'html[data-mobile-theme="dark"]': { ...darkVars, colorScheme: "dark" },
      // The UA default `body { margin: 8px }` leaves a thin strip of the
      // document-level background on the left and right of the mobile shell,
      // which reads as a "white border" around the dark content. The rest of
      // the B1 app mounts `CssBaseline` inside its own layouts; the mobile
      // shell doesn't, so we zero the body margin here.
      "body": { margin: 0 },
      ...darkInputStyles
    }}
  />
);

export const MobileThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<MobileThemeMode>("light");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") setModeState(stored);
    } catch { /* localStorage may be unavailable */ }
  }, []);

  // The CSS variables live on `<html>`, so we mirror the mode there. Clear the
  // attribute on unmount so desktop routes don't keep mobile styling.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-mobile-theme", mode);
    return () => { document.documentElement.removeAttribute("data-mobile-theme"); };
  }, [mode]);

  const setMode = useCallback((next: MobileThemeMode) => {
    setModeState(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => {
    setModeState(prev => {
      const next: MobileThemeMode = prev === "light" ? "dark" : "light";
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const value = useMemo<MobileThemeContextValue>(() => ({ mode, toggle, setMode }), [mode, toggle, setMode]);

  return (
    <MobileThemeContext.Provider value={value}>
      {mobileThemeGlobalStyles}
      {children}
    </MobileThemeContext.Provider>
  );
};
