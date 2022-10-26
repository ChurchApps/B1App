import "react-activity/dist/Dots.css";
import "@/styles/globals.css";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie"
import { EnvironmentHelper } from "@/helpers";

EnvironmentHelper.init();

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [cookies] = useCookies();

  return (
    <>
      <Head>

      </Head>
      <Component {...pageProps} />
    </>
  );
}
export default MyApp;
