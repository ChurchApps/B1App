"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GlobalStyles } from "@mui/material";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

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

const darkDefaults = {
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

const isValidColor = (value?: string | null): value is string =>
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test((value || "").trim());

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
  const appearance = config?.appearance as {
    primaryColor?: string;
    secondaryColor?: string;
    primaryContrast?: string;
  } | undefined;

  const primary = pickColor(churchColors?.primary, appearance?.primaryColor, defaults["--mb-primary"]) || defaults["--mb-primary"];
  const secondary = pickColor(churchColors?.secondary, appearance?.secondaryColor, defaults["--mb-secondary"]) || defaults["--mb-secondary"];
  const background = pickColor(churchColors?.background, defaults["--mb-background"]) || defaults["--mb-background"];
  const surface = pickColor(churchColors?.surface, defaults["--mb-surface"]) || defaults["--mb-surface"];
  const text = pickColor(churchColors?.textColor, defaults["--mb-text"]) || defaults["--mb-text"];
  const onPrimary = pickColor(churchColors?.primaryContrast, appearance?.primaryContrast, defaults["--mb-on-primary"]) || defaults["--mb-on-primary"];

  return {
    ...defaults,
    "--mb-primary": primary,
    "--mb-primary-light": mode === "dark" ? "#1a3a5c" : "#E3F2FD",
    "--mb-secondary": secondary,
    "--mb-background": background,
    "--mb-surface": surface,
    "--mb-surface-variant": mode === "dark" ? "#2D2D2D" : "#F6F6F8",
    "--mb-text": text,
    "--mb-text-secondary": mode === "dark" ? "#CCCCCC" : "#9E9E9E",
    "--mb-text-muted": mode === "dark" ? "#888888" : "#666666",
    "--mb-text-hint": mode === "dark" ? "#777777" : "#999999",
    "--mb-on-primary": onPrimary,
    "--mb-border": mode === "dark" ? "#333333" : "#F0F0F0",
    "--mb-border-light": mode === "dark" ? "#2D2D2D" : "#E5E7EB",
    "--mb-divider": mode === "dark" ? "#333333" : "#E0E0E0",
    "--mb-icon-background": mode === "dark" ? "#2D2D2D" : "#F6F6F8"
  };
};

export const MobileThemeProvider: React.FC<{ children: React.ReactNode; config?: ConfigurationInterface }> = ({ children, config }) => {
  const [mode, setModeState] = useState<MobileThemeMode>("light");

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
  const vars = useMemo(() => buildThemeVars(mode, config), [mode, config]);
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: vars["--mb-primary"], contrastText: vars["--mb-on-primary"] },
      secondary: { main: vars["--mb-secondary"] },
      background: { default: vars["--mb-background"], paper: vars["--mb-surface"] },
      text: { primary: vars["--mb-text"], secondary: vars["--mb-text-secondary"] }
    },
    shape: { borderRadius: 12 },
    typography: { fontFamily: '"Roboto","Helvetica","Arial",sans-serif' },
    components: { MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 10 } } } }
  }), [mode, vars]);

  const mobileThemeGlobalStyles = (
    <GlobalStyles
      styles={{
        ":root": vars,
        'html[data-mobile-theme="dark"]': { colorScheme: "dark" },
        'html[data-mobile-theme="light"]': { colorScheme: "light" },

        "body": { margin: 0, backgroundColor: vars["--mb-background"], color: vars["--mb-text"] },
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