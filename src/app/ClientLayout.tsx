"use client"
import "react-activity/dist/Dots.css";
import "@/styles/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@churchapps/apphelper/dist/components/markdownEditor/editor.css";

import { UserProvider } from "@/context/UserContext";
import { AnalyticsHelper } from "@churchapps/apphelper/dist/helpers/AnalyticsHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import type { ErrorAppDataInterface, ErrorLogInterface } from "@churchapps/apphelper/dist/helpers/ErrorHelper";
import React, { useEffect } from "react";
import { ErrorHelper } from "@churchapps/apphelper/dist/helpers/ErrorHelper";
import { ErrorMessages } from "@churchapps/apphelper/dist/components/ErrorMessages";
import { EnvironmentHelper } from "@/helpers";
import { ThemeProvider, createTheme } from "@mui/material";




function ClientLayout({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = React.useState([]);
  const [localeInit, setLocaleInit] = React.useState(false);
  const location = (typeof (window) === "undefined") ? null : window.location;

  useEffect(() => {
    EnvironmentHelper.init();
    EnvironmentHelper.initLocale().then(() => setLocaleInit(true));
    console.log("ENVIRONMENT HAD BEEN INIT")
    AnalyticsHelper.init();
    // Error handling configuration
    ErrorHelper.init(getErrorAppData, customErrorHandler);
  }, []);
  EnvironmentHelper.init();
  useEffect(() => { AnalyticsHelper.logPageView() }, [location]);


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
    <ThemeProvider theme={mdTheme}>
      <UserProvider>
        <ErrorMessages errors={errors} />
        <>{children}</>
      </UserProvider>
    </ThemeProvider>
  );
}
export default ClientLayout;
