import "react-activity/dist/Dots.css";
import "@/styles/globals.css";
import "@/appBase/components/markdownEditor/editor.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie"
import { EnvironmentHelper } from "@/helpers";
import { UserProvider } from "@/context/UserContext";

EnvironmentHelper.init();

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [cookies] = useCookies();

  return (
    <UserProvider>
      <Head>
      </Head>
      <Component {...pageProps} />
    </UserProvider>
  );
}
export default MyApp;
