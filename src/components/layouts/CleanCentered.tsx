"use client";

import Head from "next/head";
import { Box, Card, CssBaseline } from "@mui/material";
import type { AppearanceInterface } from "@churchapps/helpers/dist/AppearanceHelper";
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

export function CleanCentered(props: Props) {
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
          <title>{props.pageTitle || props.church?.name}</title>
          {getDescription()}
        </Head>

        <Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
          <Box sx={{ maxWidth: "930px", margin: "auto", paddingY: "72px" }}>
            <Card>
              <main>
                <div className="page">
                  <Zone church={props.church} sections={props.pageData.sections} zone="main" churchSettings={props.churchSettings} />
                </div>
              </main>
            </Card>
          </Box>
        </Box>

      </div>
    </>
  );
}
