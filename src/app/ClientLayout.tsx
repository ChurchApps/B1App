"use client";

import { UserProvider } from "@/context/UserContext";
import { UserHelper } from "@churchapps/apphelper";
import type { ErrorAppDataInterface, ErrorLogInterface } from "@churchapps/helpers";
import React, { useEffect } from "react";
import { ErrorHelper } from "@churchapps/apphelper";
import { ErrorMessages } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { GlobalStyles } from "@mui/material";
import { CookieProviderWrapper } from "@/components/CookieProviderWrapper";
import GoogleAnalytics from "@/components/GoogleAnalytics";


if (typeof window !== "undefined") EnvironmentHelper.init();

function ClientLayout({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = React.useState<string[]>([]);
  const [localeInit, setLocaleInit] = React.useState(false);
  const location = (typeof (window) === "undefined") ? null : window.location;

  useEffect(() => {
    EnvironmentHelper.initLocale().then(() => setLocaleInit(true));
    // Error handling configuration
    ErrorHelper.init(getErrorAppData, customErrorHandler);
  }, []);


  const getErrorAppData = () => {
    const result: ErrorAppDataInterface = {
      churchId: UserHelper.currentUserChurch?.church?.id || "",
      userId: UserHelper.user?.id || "",
      originUrl: location?.toString() || "",
      application: "B1"
    };
    return result;
  };

  const customErrorHandler = (error: ErrorLogInterface) => {
    switch (error.errorType) {
      case "401": setErrors(["Access denied when loading " + error.message]); break;
      case "500": setErrors(["Server error when loading " + error.message]); break;
    }
  };


  const mdTheme = createTheme({
    palette: { secondary: { main: "#444444" } },
    components: {
      MuiTextField: {
        defaultProps: { margin: "normal" },
        styleOverrides: { root: { "& .MuiOutlinedInput-root": { backgroundColor: "rgba(255, 255, 255, 0.8)" } } }
      },
      MuiFormControl: { defaultProps: { margin: "normal" } },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 6
          }
        }
      }
    },
    typography: { fontFamily: 'var(--bodyFont), "Roboto", "Helvetica", "Arial", sans-serif' },
    shape: { borderRadius: 6 }
  });

  return (
    <CookieProviderWrapper>
      <GoogleAnalytics />
      <ThemeProvider theme={mdTheme}>
        <GlobalStyles styles={{
          "body.MuiModal-open": {
            position: "fixed !important",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100% !important",
            height: "100% !important",
            overflow: "hidden !important"
          },
          "body.MuiModal-open .mobileAppRoot, body.MuiModal-open main": {
            overflow: "hidden !important",
            height: "100vh !important",
            touchAction: "none !important"
          },
          ".link-editor": {
            zIndex: "1400 !important",
            color: "#222 !important"
          },
          ".link-editor label, .link-editor .MuiFormControlLabel-label, .link-editor .MuiInputLabel-root": {
            color: "#222 !important",
            fontWeight: "500 !important"
          },
          ".link-editor .MuiInputBase-input": { color: "#222 !important" },
          ".MuiPopover-root, .MuiMenu-root, .dropdown": { zIndex: "1500 !important" }
        }} />
        <UserProvider>
          <ErrorMessages errors={errors} />
          <React.Fragment key={localeInit ? "locale-ready" : "locale-loading"}>{children}</React.Fragment>
        </UserProvider>
      </ThemeProvider>
    </CookieProviderWrapper>
  );
}
export default ClientLayout;
