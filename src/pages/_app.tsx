import "react-activity/dist/Dots.css";
import "@/styles/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/appBase/components/markdownEditor/editor.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { EnvironmentHelper } from "@/helpers";
import { UserProvider } from "@/context/UserContext";

EnvironmentHelper.init();

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <UserProvider>
      <Head>
      </Head>
      <Component {...pageProps} />
    </UserProvider>
  );
}
export default MyApp;
