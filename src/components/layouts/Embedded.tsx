"use client";

import Head from "next/head";
import { CssBaseline } from "@mui/material";
import type { AppearanceInterface } from "@churchapps/apphelper";
import type { ChurchInterface, LinkInterface } from "@churchapps/helpers";
import Zone from "./Zone";
import { PageInterface } from "@/helpers";

type Props = {
  pageData: PageInterface;
  pageTitle?: string;
  metaDescription?: string;
  ogDescription?: string;
  churchSettings?: AppearanceInterface;
  church?: ChurchInterface;
  navLinks?: LinkInterface[];
};

export function Embedded(props: Props) {
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
      <div id="embeddedLayout">
        <Head>
          <title>{props.pageTitle || props.church?.name}</title>
          {getDescription()}
        </Head>

        <main id="main-content">
          <div className="page">
            <Zone church={props.church!} sections={props.pageData.sections!} zone="main" churchSettings={props.churchSettings!} />
          </div>
        </main>

      </div>
    </>
  );
}
