"use client";

import UserContext, { UserProvider } from "@/context/UserContext";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { ErrorAppDataInterface, ErrorLogInterface, LoginResponseInterface } from "@churchapps/helpers";
import React, { useContext, useEffect } from "react";
import { ErrorHelper } from "@churchapps/apphelper";
import { ErrorMessages } from "@churchapps/apphelper";
import { EnvironmentHelper } from "@/helpers";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CookieProviderWrapper } from "@/components/CookieProviderWrapper";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { useHashScroll } from "@/hooks/useHashScroll";
import { useParams, usePathname } from "next/navigation";
import { useCookies } from "react-cookie";
import { hydrateUserSession } from "@/app/[sdSlug]/mobile/hooks/hydrateUserSession";



if (typeof window !== "undefined") EnvironmentHelper.init();

// Restore the member's session from the jwt cookie written at login (website or /mobile)
// so website pages don't show them as logged out. Login/logout pages manage the cookie.
function WebsiteSessionRestore() {
  const context = useContext(UserContext);
  const params = useParams<{ sdSlug?: string }>();
  const pathname = usePathname() || "";
  const [cookies] = useCookies(["jwt"]);

  useEffect(() => {
    if (/^\/(login|logout)(\/|$)/.test(pathname)) return;
    if (UserHelper.user?.id || !cookies.jwt) return;
    ApiHelper.postAnonymous("/users/login", { jwt: cookies.jwt }, "MembershipApi")
      .then((resp: LoginResponseInterface) => { if (resp?.user) return hydrateUserSession(resp, context, { sdSlug: params?.sdSlug }); })
      .catch(() => { /* expired or invalid jwt: stay anonymous */ });
  }, []);

  return null;
}

function ClientLayout({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = React.useState<string[]>([]);
  const [localeInit, setLocaleInit] = React.useState(false);
  const location = (typeof (window) === "undefined") ? null : window.location;

  useEffect(() => {
    EnvironmentHelper.initLocale().then(() => setLocaleInit(true));
    // Error handling configuration
    ErrorHelper.init(getErrorAppData, customErrorHandler);
  }, []);

  useHashScroll(localeInit);


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
        <UserProvider>
          <WebsiteSessionRestore />
          <ErrorMessages errors={errors} />
          <React.Fragment key={localeInit ? "locale-ready" : "locale-loading"}>{children}</React.Fragment>
        </UserProvider>
      </ThemeProvider>
    </CookieProviderWrapper>
  );
}
export default ClientLayout;
