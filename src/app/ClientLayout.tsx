"use client"
import "react-activity/dist/Dots.css";
import "@/styles/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@churchapps/apphelper/dist/components/markdownEditor/editor.css";

import { UserProvider } from "@/context/UserContext";
import { AnalyticsHelper, UserHelper, ErrrorAppDataInterface, ErrorLogInterface } from "@churchapps/apphelper";
import React, { useEffect } from "react";
import { ErrorHelper } from "@churchapps/apphelper";
import { ErrorMessages } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers";




function ClientLayout({ children}: {children: React.ReactNode}) {
  const [errors, setErrors] = React.useState([]);
  const [localeInit, setLocaleInit] = React.useState(false);
  const location = (typeof(window) === "undefined") ? null : window.location;



  useEffect(() => {
    // Initialize EnvironmentHelper and AnalyticsHelper on the client
    EnvironmentHelper.initLocale().then(() => setLocaleInit(true));
    EnvironmentHelper.init();
    AnalyticsHelper.init();
    // Error handling configuration
    ErrorHelper.init(getErrorAppData, customErrorHandler);
  }, []);

  useEffect(() => { AnalyticsHelper.logPageView() }, [location]);


  const getErrorAppData = () => {
    const result: ErrrorAppDataInterface = {
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

  AnalyticsHelper.init();
  ErrorHelper.init(getErrorAppData, customErrorHandler);
  React.useEffect(() => { AnalyticsHelper.logPageView() }, [location]);

  return (
    <UserProvider>
      <ErrorMessages errors={errors} />
      <>{children}</>
    </UserProvider>
  );
}
export default ClientLayout;
