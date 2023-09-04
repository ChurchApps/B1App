import "react-activity/dist/Dots.css";
import "@/styles/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
//import "@chuchapps/apiHelper/components/markdownEditor/editor.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { EnvironmentHelper, ConfigHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { UserProvider } from "@/context/UserContext";
import { AnalyticsHelper, UserHelper, ErrrorAppDataInterface, ErrorLogInterface } from "@churchapps/apphelper";
import React from "react";
import { ErrorHelper, AppearanceHelper } from "@churchapps/apphelper";
import { ErrorMessages } from "@churchapps/apphelper";

EnvironmentHelper.init();

function MyApp({ Component, pageProps }: AppProps) {
  const [config, setConfig] = React.useState<ConfigurationInterface>(null);
  const [errors, setErrors] = React.useState([]);
  const location = (typeof(window) === "undefined") ? null : window.location;


  const getErrorAppData = () => {
    const result: ErrrorAppDataInterface = {
      churchId: UserHelper.currentUserChurch?.church?.id || "",
      userId: UserHelper.user?.id || "",
      originUrl: location?.toString(),
      application: "CHUMS"
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

  React.useEffect(() => {
    const subdomain = location.hostname.split(".")?.[0]?.toString();
    const getConfig = async () => {
      const response = await ConfigHelper.load(subdomain);
      response && setConfig(response);
      return response;
    }
    if (subdomain) {
      getConfig();
    }
  }, [location])

  const favicon = config?.appearance?.favicon_16x16 && AppearanceHelper.getFavicon(config.appearance, "16");

  return (
    <UserProvider>
      <Head>
        {favicon
          ? <link rel="shortcut icon" type="image/png" href={favicon} />
          : <link rel="icon" href="/favicon.ico" />
        }
      </Head>
      <ErrorMessages errors={errors} />
      <Component {...pageProps} />
    </UserProvider>
  );
}
export default MyApp;
