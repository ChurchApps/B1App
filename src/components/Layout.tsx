"use client";

import Head from "next/head";
import { Header } from "./Header";
import { CssBaseline } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

type Props = {
  children: React.ReactNode;
  withoutNavbar?: boolean;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  image?: string;
  config?: ConfigurationInterface;
};

export function Layout(props: Props) {
  const getDescription = () => {
    if (props.metaDescription) {
      return (<>
        <meta name="description" content={props.metaDescription}></meta>
        <meta property="og:description" content={props.ogDescription || props.metaDescription}></meta>
      </>);
    }
  };

  return (
    <>
      <CssBaseline />
      <div>
        <Head>
          <title>{props.pageTitle || props.config?.church?.name}</title>
          {getDescription()}
        </Head>
        {!props.withoutNavbar && <Header config={props.config} overlayContent={false} />}
        <main>{props.children}</main>
      </div>
    </>
  );
}
