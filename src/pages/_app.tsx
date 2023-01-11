import "react-activity/dist/Dots.css";
import "@/styles/globals.css";
import "@/appBase/components/markdownEditor/editor.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
//import { UserProvider } from "@/context/UserContext";
import { LoadingPage } from "@/components";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { SubdomainHelper } from "@/helpers/SubdomainHelper";
import { useState, useEffect } from "react";

//EnvironmentHelper.init();

function MyApp({ Component, pageProps }: AppProps) {

  /*
  const [config, setConfig] = useState<ConfigurationInterface>({} as ConfigurationInterface)

  const loadConfig = () => {
    SubdomainHelper.subDomain = window.location.hostname.split(".")[0];

    ConfigHelper.load(SubdomainHelper.subDomain).then(data => {
      setConfig(data);
    })
  }

  useEffect(loadConfig, [])

  if (config.keyName === undefined) {
    return <LoadingPage config={config} />
  }*/

  return (
    <>
      <Head>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
export default MyApp;
