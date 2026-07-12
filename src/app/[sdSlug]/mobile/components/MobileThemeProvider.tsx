"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GlobalStyles } from "@mui/material";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { accent as deriveAccent, isValidHex as isValidHexColor, shade, tint } from "@/helpers/colorTints";

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

const lightDefaults = {
  "--mb-primary": "#0D47A1",
  "--mb-primary-light": "#E3F2FD",
  "--mb-secondary": "#568BDA",
  "--mb-background": "#F0F4F9",
  "--mb-surface": "#FFFFFF",
  "--mb-surface-variant": "#F0F4F9",
  "--mb-text": "#101E38",
  "--mb-text-secondary": "#5F6C82",
  "--mb-text-muted": "#5F6C82",
  "--mb-text-hint": "#93A0B4",
  "--mb-on-primary": "#FFFFFF",
  "--mb-success": "#2E9E52",
  "--mb-warning": "#B97E14",
  "--mb-error": "#B0120C",
  "--mb-border": "#E2E9F4",
  "--mb-border-light": "#EAEFF7",
  "--mb-divider": "#E2E9F4",
  "--mb-icon-background": "#E6EDF7",
  "--mb-disabled": "#A9B4C6"
};

const darkDefaults = {
  "--mb-primary": "#6FA0E8",
  "--mb-primary-light": "#12294D",
  "--mb-secondary": "#6BA4E8",
  "--mb-background": "#070E1B",
  "--mb-surface": "#0E1930",
  "--mb-surface-variant": "#15223E",
  "--mb-text": "#E7ECF5",
  "--mb-text-secondary": "#A2AFC6",
  "--mb-text-muted": "#8D9BB4",
  "--mb-text-hint": "#6E7C96",
  "--mb-on-primary": "#FFFFFF",
  "--mb-success": "#6FCB8B",
  "--mb-warning": "#E4A94E",
  "--mb-error": "#E57373",
  "--mb-border": "#1D2C4C",
  "--mb-border-light": "#16233F",
  "--mb-divider": "#1D2C4C",
  "--mb-icon-background": "#15223E",
  "--mb-disabled": "#4C5A74"
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

const isValidColor = isValidHexColor;

const pickColor = (...values: Array<string | null | undefined>) =>
  values.find((value) => isValidColor(value));

const getChurchColors = (mode: MobileThemeMode, config?: ConfigurationInterface) => {
  const appTheme = config?.appTheme?.[mode];
  if (!appTheme) return null;

  const hasUsableTheme = [appTheme.primary, appTheme.secondary, appTheme.background, appTheme.surface, appTheme.textColor]
    .some((value) => isValidColor(value));

  if (!hasUsableTheme) return null;
  return appTheme;
};

const buildThemeVars = (mode: MobileThemeMode, config?: ConfigurationInterface) => {
  const defaults = mode === "dark" ? darkDefaults : lightDefaults;
  const churchColors = getChurchColors(mode, config);
  // In dark mode, derive primary from light theme to avoid generic fallback.
  const lightChurchColors = mode === "dark" ? getChurchColors("light", config) : null;
  const appearance = config?.appearance as {
    primaryColor?: string;
    secondaryColor?: string;
    primaryContrast?: string;
  } | undefined;

  // Resolve primary with dark-mode lightening fallback.
  let primary: string;
  if (isValidHexColor(churchColors?.primary)) {
    primary = churchColors!.primary as string;
  } else if (mode === "dark") {
    const lightPrimary = pickColor(lightChurchColors?.primary, appearance?.primaryColor);
    primary = isValidHexColor(lightPrimary) ? tint(lightPrimary, 0.3) : defaults["--mb-primary"];
  } else {
    primary = pickColor(churchColors?.primary, appearance?.primaryColor, defaults["--mb-primary"]) || defaults["--mb-primary"];
  }

  const secondary = pickColor(churchColors?.secondary, appearance?.secondaryColor, defaults["--mb-secondary"]) || defaults["--mb-secondary"];

  // Brand hue for derived surfaces/washes — always the light-mode primary, not the lightened dark variant.
  const brandBase = pickColor(lightChurchColors?.primary, mode === "light" ? churchColors?.primary : undefined, appearance?.primaryColor, "#0D47A1") || "#0D47A1";

  const derivedBackground = mode === "dark" ? shade(brandBase, 0.90) : tint(brandBase, 0.94);
  const derivedSurface = mode === "dark" ? shade(brandBase, 0.80) : "#FFFFFF";
  const derivedText = mode === "dark" ? defaults["--mb-text"] : shade(brandBase, 0.72);

  const background = pickColor(churchColors?.background, derivedBackground) || derivedBackground;
  const surface = pickColor(churchColors?.surface, derivedSurface) || derivedSurface;
  const text = pickColor(churchColors?.textColor, derivedText) || derivedText;
  const onPrimary = pickColor(churchColors?.primaryContrast, appearance?.primaryContrast, defaults["--mb-on-primary"]) || defaults["--mb-on-primary"];

  const primaryLight = isValidHexColor(primary)
    ? (mode === "dark" ? shade(primary, 0.75) : tint(primary, 0.87))
    : defaults["--mb-primary-light"];
  const accentColor = isValidHexColor(secondary) ? secondary : (isValidHexColor(primary) ? deriveAccent(primary) : secondary);

  // Color-wash stops for photo-less media cards: brand hue drifting warm across the gradient.
  const wash1 = shade(brandBase, 0.45);
  const wash2 = shade(deriveAccent(brandBase), 0.40);
  const wash3 = shade(deriveAccent(deriveAccent(brandBase)), 0.30);

  return {
    ...defaults,
    "--mb-primary": primary,
    "--mb-primary-light": primaryLight,
    "--mb-secondary": secondary,
    "--mb-accent": accentColor,
    "--mb-background": background,
    "--mb-surface": surface,
    "--mb-surface-variant": mode === "dark" ? shade(brandBase, 0.72) : tint(brandBase, 0.90),
    "--mb-text": text,
    "--mb-on-primary": onPrimary,
    "--mb-border": mode === "dark" ? shade(brandBase, 0.62) : tint(brandBase, 0.88),
    "--mb-border-light": mode === "dark" ? shade(brandBase, 0.70) : tint(brandBase, 0.91),
    "--mb-divider": mode === "dark" ? shade(brandBase, 0.62) : tint(brandBase, 0.88),
    "--mb-icon-background": mode === "dark" ? shade(brandBase, 0.72) : tint(brandBase, 0.90),
    "--mb-wash-1": wash1,
    "--mb-wash-2": wash2,
    "--mb-wash-3": wash3,
    "--mb-verse-1": shade(brandBase, 0.10),
    "--mb-verse-2": shade(brandBase, 0.55),
    "--mb-font-sans": '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    // Surface tokens — exposed so downstream components can drop hardcoded values.
    "--mb-radius-sm": "6px",
    "--mb-radius-md": "10px",
    "--mb-radius-lg": "16px",
    "--mb-radius-xl": "22px",
    "--mb-shadow-sm": "0 1px 2px rgba(16,30,56,0.04)",
    "--mb-shadow-md": "0 4px 14px rgba(16,30,56,0.08)",
    "--mb-shadow-lg": "0 10px 30px rgba(16,30,56,0.14)"
  };
};

export const MobileThemeProvider: React.FC<{ children: React.ReactNode; config?: ConfigurationInterface }> = ({ children, config }) => {
  const [mode, setModeState] = useState<MobileThemeMode>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let stored: string | null = null;
    try { stored = window.localStorage.getItem(STORAGE_KEY); } catch { }
    if (stored === "light" || stored === "dark") {
      setModeState(stored);
      return;
    }
    // Follow OS preference until user toggles (which writes to localStorage).
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setModeState(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY)) return;
      } catch { }
      setModeState(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
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
  const vars = useMemo(() => buildThemeVars(mode, config), [mode, config]);
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: vars["--mb-primary"], contrastText: vars["--mb-on-primary"] },
      secondary: { main: vars["--mb-secondary"] },
      background: { default: vars["--mb-background"], paper: vars["--mb-surface"] },
      text: { primary: vars["--mb-text"], secondary: vars["--mb-text-secondary"] }
    },
    shape: { borderRadius: 14 },
    typography: { fontFamily: vars["--mb-font-sans"] },
    components: { MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 999, fontWeight: 600, boxShadow: "none" } } } }
  }), [mode, vars]);

  const mobileThemeGlobalStyles = (
    <GlobalStyles
      styles={{
        ":root": vars,
        'html[data-mobile-theme="dark"]': { colorScheme: "dark" },
        'html[data-mobile-theme="light"]': { colorScheme: "light" },

        "body": { margin: 0, backgroundColor: vars["--mb-background"], color: vars["--mb-text"] },
        "@media (prefers-reduced-motion: reduce)": { "*, *::before, *::after": { transitionDuration: "0.01ms !important", animationDuration: "0.01ms !important" } },
        ...darkInputStyles
      }}
    />
  );

  return (
    <MobileThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiTheme}>
        {mobileThemeGlobalStyles}
        {children}
      </MuiThemeProvider>
    </MobileThemeContext.Provider>
  );
};
