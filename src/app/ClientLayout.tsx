"use client"
import "react-activity/dist/Dots.css";
import "@/styles/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@churchapps/apphelper-markdown/dist/components/markdownEditor/editor.css";

import { UserProvider } from "@/context/UserContext";
import { UserHelper } from "@churchapps/apphelper";
import type { ErrorAppDataInterface, ErrorLogInterface } from "@churchapps/helpers";
import React, { useEffect } from "react";
import { ErrorHelper } from "@churchapps/apphelper";
import { ErrorMessages } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers";
import { ThemeProvider, createTheme } from "@mui/material";
import { CookieProviderWrapper } from "@/components/CookieProviderWrapper";
import GoogleAnalytics from "@/components/GoogleAnalytics";




function ClientLayout({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = React.useState([]);
  const [localeInit, setLocaleInit] = React.useState(false);
  const location = (typeof (window) === "undefined") ? null : window.location;

  useEffect(() => {
    EnvironmentHelper.init();
    EnvironmentHelper.initLocale().then(() => setLocaleInit(true));
    console.log("ENVIRONMENT HAD BEEN INIT")
    // Error handling configuration
    ErrorHelper.init(getErrorAppData, customErrorHandler);
  }, []);


  const getErrorAppData = () => {
    const result: ErrorAppDataInterface = {
      churchId: UserHelper.currentUserChurch?.church?.id || "",
      userId: UserHelper.user?.id || "",
      originUrl: location?.toString(),
      application: "B1"
    }
    return result;
  }

  const customErrorHandler = (error: ErrorLogInterface) => {
    switch (error.errorType) {
      case "401": setErrors(["Access denied when loading " + error.message]); break;
      case "500": setErrors(["Server error when loading " + error.message]); break;
    }
  }


  const mdTheme = createTheme({
    palette: {
      secondary: {
        main: "#444444"
      }
    },
    components: {
      MuiTextField: { defaultProps: { margin: "normal" } },
      MuiFormControl: { defaultProps: { margin: "normal" } }
    }
  });

  return (
    <CookieProviderWrapper>
      <GoogleAnalytics />
      <ThemeProvider theme={mdTheme}>
        <UserProvider>
          <ErrorMessages errors={errors} />
          <>{children}</>
        </UserProvider>
      </ThemeProvider>
    </CookieProviderWrapper>
  );
}
export default ClientLayout;
