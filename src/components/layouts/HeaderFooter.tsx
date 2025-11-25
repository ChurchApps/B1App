"use client";

import Head from "next/head";
import { Header } from "../Header";
import { CssBaseline } from "@mui/material";
import { ArrayHelper } from "@churchapps/apphelper";
import Zone from "./Zone";
import { Footer } from "./Footer";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { PageInterface } from "@/helpers";

type Props = {
  pageData: PageInterface;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  config?: ConfigurationInterface;
};

export function HeaderFooter(props: Props) {
  const getDescription = () => {
    if (props.metaDescription) return (<>
      <meta name="description" content={props.metaDescription}></meta>
      <meta property="og:description" content={props.ogDescription || props.metaDescription}></meta>
    </>);
  }

  const footerSections = ArrayHelper.getAll(props.pageData.sections, "zone", "siteFooter");

  return (
    <>
      <CssBaseline />
      <div>
        <Head>
          <title>{props.pageTitle || props.config?.church?.name}</title>
          {getDescription()}
        </Head>
        <Header config={props.config} overlayContent={props.pageData?.url === "/"} sections={props.pageData.sections} />
        <main>
          <div className="page">
            <Zone church={props.config?.church} sections={props.pageData.sections} zone="main" churchSettings={props.config?.appearance} />
          </div>
        </main>
        <Footer config={props.config} footerSections={footerSections} />
      </div>
    </>
  );
}
