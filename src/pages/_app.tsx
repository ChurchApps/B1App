import "react-activity/dist/Dots.css";
import "@/styles/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@/appBase/components/markdownEditor/editor.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { EnvironmentHelper } from "@/helpers";
import { UserProvider } from "@/context/UserContext";
import { AnalyticsHelper } from "@/appBase/helpers";
import React from "react";

EnvironmentHelper.init();

function MyApp({ Component, pageProps }: AppProps) {
  const location = (typeof(window) === "undefined") ? null : window.location;
  AnalyticsHelper.init();
  React.useEffect(() => { AnalyticsHelper.logPageView() }, [location]);

  return (
    <UserProvider>
      <Head>
      </Head>
      <Component {...pageProps} />
    </UserProvider>
  );
}
export default MyApp;
