"use client";

import Head from "next/head";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CssBaseline } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

type Props = {
  children: React.ReactNode;
  withoutNavbar?: boolean;
  withoutFooter?: boolean;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  image?: string;
  config?: ConfigurationInterface;
};

export function Layout(props: Props) {
  const getDescription = () => {
    if (props.metaDescription) return (<>
      <meta name="description" content={props.metaDescription}></meta>
      <meta property="og:description" content={props.ogDescription || props.metaDescription}></meta>
    </>);
  }

  // const getImage = () => {
  //   if (props.image) return (<meta property="og:image" content={props.image}></meta>);
  // }

  // const mdTheme = createTheme({
  //   palette: {
  //     secondary: {
  //       main: "#444444"
  //     }
  //   },
  //   components: {
  //     MuiTextField: { defaultProps: { margin: "normal" } },
  //     MuiFormControl: { defaultProps: { margin: "normal" } }
  //   }
  // });

  return (
    <>
      <CssBaseline />
      <div>
        <Head>
          <title>{props.pageTitle || props.config?.church?.name}</title>
          {getDescription()}
          {/* {getImage()} */}
        </Head>
        {!props.withoutNavbar && <Header config={props.config} overlayContent={false} />}
        <main>{props.children}</main>
        {!props.withoutFooter && <Footer church={props.config?.church} churchSettings={props.config?.appearance} />}
      </div>
    </>
  );
}
