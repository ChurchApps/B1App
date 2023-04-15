import "react-activity/dist/Dots.css";
import "@/styles/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@/appBase/components/markdownEditor/editor.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { EnvironmentHelper, AppearanceHelper, ConfigHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { UserProvider } from "@/context/UserContext";
import { AnalyticsHelper } from "@/appBase/helpers";
import React from "react";

EnvironmentHelper.init();

function MyApp({ Component, pageProps }: AppProps) {
  const [config, setConfig] = React.useState<ConfigurationInterface>(null);
  
  const location = (typeof(window) === "undefined") ? null : window.location;
  AnalyticsHelper.init();
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
      <Component {...pageProps} />
    </UserProvider>
  );
}
export default MyApp;
