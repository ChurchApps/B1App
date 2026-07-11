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

if (typeof window !== "undefined") EnvironmentHelper.init();

const mobileMuiTheme = createTheme({
  palette: { primary: { main: "#0D47A1" }, secondary: { main: "#444444" } },
  shape: { borderRadius: 14 },
  typography: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  components: { MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 999, fontWeight: 600, boxShadow: "none" } } } }
});

function MobileHydrationGate({ children }: { children: React.ReactNode }) {
  const status = useHydrateSession();
  const showSpinner = status === "idle" || status === "hydrating";

  if (showSpinner) {
    return (
      <Box
        role="status"
        aria-live="polite"
        aria-label={Locale.label("mobile.loading")}
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

export function MobileClientLayout({ children }: { children: React.ReactNode }) {
  const [localeReady, setLocaleReady] = React.useState(false);

  useEffect(() => {
    EnvironmentHelper.initLocale().then(() => setLocaleReady(true));
    ErrorHelper.init(
      (): ErrorAppDataInterface => ({
        churchId: UserHelper.currentUserChurch?.church?.id || "",
        userId: UserHelper.user?.id || "",
        originUrl: typeof window !== "undefined" ? window.location.toString() : "",
        application: "B1Mobile"
      }),
      () => {}
    );
  }, []);

  return (
    <CookieProviderWrapper>
      <ThemeProvider theme={mobileMuiTheme}>
        <GlobalStyles styles={{
          "html, body": { overflowX: "hidden", maxWidth: "100%" },
          img: { maxWidth: "100%" }
        }} />
        <UserProvider>
          <MobileQueryProvider>
            <MobileGoogleAnalytics />
            <MobileHydrationGate>
              {localeReady ? children : (
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
