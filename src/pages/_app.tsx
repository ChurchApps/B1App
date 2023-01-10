import "react-activity/dist/Dots.css";
import "@/styles/globals.css";
import "@/appBase/components/markdownEditor/editor.css";
import { useState, useEffect } from "react"
import type { AppProps } from "next/app";
import Head from "next/head";
import { EnvironmentHelper } from "@/helpers";
import { UserProvider } from "@/context/UserContext";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { LoadingPage } from "@/components"
import { SubdomainHelper } from "@/helpers/SubdomainHelper";

EnvironmentHelper.init();

function MyApp({ Component, pageProps }: AppProps) {
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
  }

  return (
    <UserProvider>
      <Head>
      </Head>
      <Component {...pageProps} />
    </UserProvider>
  );
}
export default MyApp;
