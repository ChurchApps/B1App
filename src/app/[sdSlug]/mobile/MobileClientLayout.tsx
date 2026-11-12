"use client";

import React, { useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CircularProgress, GlobalStyles } from "@mui/material";
import { ErrorHelper, Locale, UserHelper } from "@churchapps/apphelper";
import type { ErrorAppDataInterface } from "@churchapps/helpers";
import { CookieProviderWrapper } from "@/components/CookieProviderWrapper";
import { EnvironmentHelper } from "@/helpers";
import { UserProvider } from "@/context/UserContext";
import { MobileQueryProvider } from "./MobileQueryProvider";
import MobileGoogleAnalytics from "./MobileGoogleAnalytics";
import { useHydrateSession } from "./hooks/useHydrateSession";
import { useHashScroll } from "@/hooks/useHashScroll";

// Child effects run before this component's useEffect, and production runs them once.
// Session restore posts /users/login from a child effect, so the API URLs have to exist first.
if (typeof window !== "undefined") EnvironmentHelper.init();

const mobileMuiTheme = createTheme({
  palette: { primary: { main: "#0D47A1" }, secondary: { main: "#444444" } },
  shape: { borderRadius: 14 },
  typography: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  components: { MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 999, fontWeight: 600, boxShadow: "none" } } } }
});

// Any key from public/locales; it only resolves once B1App's own locale file has loaded.
const LOCALE_PROBE_KEY = "mobile.screenTitles.signIn";

// Locale.init swallows fetch errors and initializes i18n with whatever arrived, so a dropped
// request leaves every label as its key. Retry a couple of times before giving up.
const loadLocale = async (isCancelled: () => boolean) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    if (isCancelled()) return;
    await EnvironmentHelper.initLocale();
    if (Locale.label(LOCALE_PROBE_KEY) !== LOCALE_PROBE_KEY) return;
  }
};

function MobileHydrationGate({ children }: { children: React.ReactNode }) {
  const status = useHydrateSession();
  const showSpinner = status === "idle" || status === "hydrating";

  if (showSpinner) {
    return (
      <Box
        role="status"
        aria-live="polite"
        aria-label={Locale.label("mobile.screens.loading")}
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#FFFFFF"
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return <>{children}</>;
}

const mobileShellFallback = (
  <div
    role="status"
    aria-live="polite"
    style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }}
  />
);

export function MobileClientLayout({ children, churchGaId }: { children: React.ReactNode; churchGaId?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [localeReady, setLocaleReady] = React.useState(false);
  const [localeVersion, setLocaleVersion] = React.useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    EnvironmentHelper.init();
    // Stop waiting after 8s so a slow connection doesn't leave a spinner up forever. Screens read
    // labels at render time and nothing re-renders them when i18n finishes, so a load that lands
    // after the timeout remounts the screen; otherwise it keeps showing raw keys (mobile.login.signInTo).
    let timedOut = false;
    let cancelled = false;
    const localeTimeout = setTimeout(() => { timedOut = true; setLocaleReady(true); }, 8000);
    loadLocale(() => cancelled)
      .catch((e) => console.error("Locale init failed", e))
      .finally(() => {
        clearTimeout(localeTimeout);
        if (cancelled) return;
        if (timedOut) setLocaleVersion((v) => v + 1);
        setLocaleReady(true);
      });
    ErrorHelper.init(
      (): ErrorAppDataInterface => ({
        churchId: UserHelper.currentUserChurch?.church?.id || "",
        userId: UserHelper.user?.id || "",
        originUrl: window.location.toString(),
        application: "B1Mobile"
      }),
      () => {}
    );
    return () => { cancelled = true; clearTimeout(localeTimeout); };
  }, [mounted]);

  useHashScroll(localeReady);

  if (!mounted) return mobileShellFallback;

  return (
    <CookieProviderWrapper>
      <ThemeProvider theme={mobileMuiTheme}>
        <GlobalStyles styles={{
          "html, body": { overflowX: "hidden", maxWidth: "100%" },
          img: { maxWidth: "100%" }
        }} />
        <UserProvider>
          <MobileQueryProvider>
            <MobileGoogleAnalytics churchGaId={churchGaId} />
            <MobileHydrationGate>
              {localeReady ? <React.Fragment key={localeVersion}>{children}</React.Fragment> : (
                <Box role="status" aria-live="polite" sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#FFFFFF" }}>
                  <CircularProgress size={40} />
                </Box>
              )}
            </MobileHydrationGate>
          </MobileQueryProvider>
        </UserProvider>
      </ThemeProvider>
    </CookieProviderWrapper>
  );
}
