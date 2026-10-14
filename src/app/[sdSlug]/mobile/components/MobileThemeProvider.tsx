"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GlobalStyles } from "@mui/material";
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { isValidHex as isValidHexColor, mix } from "@/helpers/colorTints";

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

const DEFAULT_PRIMARY = "#1765C1";

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

const lum = (hex: string) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Soft Blue (B1Admin default theme) with the church primary standing in for B1 blue: every surface,
// hairline, chip and the desktop header are mixed from that one color; status colors stay fixed.
const buildThemeVars = (mode: MobileThemeMode, config?: ConfigurationInterface) => {
  const dark = mode === "dark";
  const churchColors = getChurchColors(mode, config);
  const lightChurchColors = dark ? getChurchColors("light", config) : null;
  const appearance = config?.appearance as { primaryColor?: string; primaryContrast?: string } | undefined;
  const brand = pickColor(lightChurchColors?.primary, dark ? undefined : churchColors?.primary, appearance?.primaryColor, DEFAULT_PRIMARY) || DEFAULT_PRIMARY;
  const W = "#FFFFFF", K = "#000000";

  const primary = pickColor(churchColors?.primary, dark ? mix(brand, W, 0.4) : brand) as string;
  const onPrimary = pickColor(churchColors?.primaryContrast, dark ? undefined : appearance?.primaryContrast) || (lum(primary) > 0.42 ? "#121820" : "#FFFFFF");
  const background = pickColor(churchColors?.background, dark ? mix(brand, "#0b0f15", 0.9) : mix(brand, W, 0.955)) as string;
  const surface = pickColor(churchColors?.surface, dark ? mix(brand, "#141a22", 0.88) : W) as string;
  const text = pickColor(churchColors?.textColor, dark ? "#E6EBF1" : mix(brand, "#141b24", 0.9)) as string;
  const muted = dark ? "#A7B1BD" : mix(brand, "#566170", 0.88);
  const border = dark ? mix(brand, "#2a323d", 0.85) : mix(brand, "#dfe4ea", 0.9);
  const control = dark ? mix(brand, "#6d7785", 0.85) : mix(brand, "#7b8592", 0.88);
  const chip = dark ? mix(brand, "#141a22", 0.65) : mix(brand, W, 0.87);
  const deep = mix(brand, K, dark ? 0.45 : 0.4);
  const status = dark
    ? { ok: "#80D0A0", okBg: "#16301F", warn: "#F2C063", warnBg: "#3A2C0E", bad: "#F2939B", badBg: "#3D1A1E", neu: "#B4C2D2", neuBg: "#243142" }
    : { ok: "#236A43", okBg: "#E8F4EC", warn: "#805000", warnBg: "#FFF3D6", bad: "#AC2834", badBg: "#FDEDEF", neu: "#465A71", neuBg: "#EDF1F6" };

  return {
    "--mb-primary": primary,
    "--mb-primary-light": chip,
    "--mb-primary-deep": deep,
    "--mb-secondary": primary,
    "--mb-accent": primary,
    "--mb-background": background,
    "--mb-surface": surface,
    "--mb-surface-variant": background,
    "--mb-text": text,
    "--mb-text-secondary": muted,
    "--mb-text-muted": muted,
    "--mb-text-hint": control,
    "--mb-on-primary": onPrimary,
    "--mb-success": status.ok,
    "--mb-success-bg": status.okBg,
    "--mb-warning": status.warn,
    "--mb-warning-bg": status.warnBg,
    "--mb-error": status.bad,
    "--mb-error-bg": status.badBg,
    "--mb-neutral": status.neu,
    "--mb-neutral-bg": status.neuBg,
    "--mb-border": border,
    "--mb-border-light": border,
    "--mb-divider": border,
    "--mb-control": control,
    "--mb-link": dark ? mix(brand, W, 0.5) : mix(brand, K, 0.08),
    "--mb-eyebrow": dark ? mix(brand, W, 0.5) : mix(brand, K, 0.05),
    "--mb-selected": dark ? mix(brand, "#141a22", 0.6) : mix(brand, W, 0.85),
    "--mb-on-selected": dark ? mix(brand, W, 0.8) : mix(brand, K, 0.45),
    "--mb-chip": chip,
    "--mb-on-chip": dark ? mix(brand, W, 0.78) : mix(brand, K, 0.45),
    "--mb-icon-background": chip,
    "--mb-header": mix(brand, K, dark ? 0.72 : 0.58),
    "--mb-disabled": control,
    // Legacy art tokens resolve flat so any leftover wash/verse background reads as a plain deep panel.
    "--mb-wash-1": deep,
    "--mb-wash-2": deep,
    "--mb-wash-3": deep,
    "--mb-verse-1": deep,
    "--mb-verse-2": deep,
    "--mb-font-sans": "inherit",
    "--mb-radius-sm": "6px",
    "--mb-radius-md": "10px",
    "--mb-radius-lg": "10px",
    "--mb-radius-xl": "16px",
    "--mb-shadow-sm": "none",
    "--mb-shadow-md": "none",
    "--mb-shadow-lg": "0 12px 40px rgba(8,12,20,0.22)"
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
    shape: { borderRadius: 6 },
    typography: { fontFamily: "inherit", button: { fontWeight: 600, textTransform: "none" } },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 6, minHeight: 40, paddingLeft: 16, paddingRight: 16, boxShadow: "none" },
          outlined: { borderColor: vars["--mb-control"], color: vars["--mb-text"], "&:hover": { borderColor: vars["--mb-control"], backgroundColor: vars["--mb-background"] } },
          sizeLarge: { minHeight: 48, fontSize: 15 }
        }
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 10 } } },
      MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: `1px solid ${vars["--mb-border"]}`, borderRadius: 10 } } }
    }
  }), [mode, vars]);

  const mobileThemeGlobalStyles = (
    <GlobalStyles
      styles={{
        ":root": {
          ...vars,
          "--safe-top": "env(safe-area-inset-top, 0px)",
          "--safe-bottom": "env(safe-area-inset-bottom, 0px)",
          "--safe-left": "env(safe-area-inset-left, 0px)",
          "--safe-right": "env(safe-area-inset-right, 0px)"
        },
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
