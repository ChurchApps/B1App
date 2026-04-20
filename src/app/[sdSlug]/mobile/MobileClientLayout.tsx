"use client";

import React, { useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CircularProgress } from "@mui/material";
import { ErrorHelper, UserHelper } from "@churchapps/apphelper";
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
  shape: { borderRadius: 12 },
  typography: { fontFamily: '"Roboto","Helvetica","Arial",sans-serif' },
  components: { MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 10 } } } }
});

/**
 * Gates rendering on one-shot JWT-cookie rehydration so returning users with a
 * valid session are treated as logged-in before any child screen probes
 * `UserHelper.user`. The signed-out path (no cookie / expired cookie) falls
 * through immediately to the normal anonymous render.
 */
function MobileHydrationGate({ children }: { children: React.ReactNode }) {
  const status = useHydrateSession();
  const showSpinner = status === "idle" || status === "hydrating";

  if (showSpinner) {
    return (
      <Box
        role="status"
        aria-live="polite"
        aria-label="Loading"
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
  useEffect(() => {
    EnvironmentHelper.initLocale();
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

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      // Session resume hook — screens using useQuery will refetch on focus automatically.
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <CookieProviderWrapper>
      <ThemeProvider theme={mobileMuiTheme}>
        <UserProvider>
          <MobileQueryProvider>
            <MobileGoogleAnalytics />
            <MobileHydrationGate>{children}</MobileHydrationGate>
          </MobileQueryProvider>
        </UserProvider>
      </ThemeProvider>
    </CookieProviderWrapper>
  );
}
