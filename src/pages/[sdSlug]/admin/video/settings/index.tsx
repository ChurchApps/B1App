import { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ApiHelper, ConfigHelper, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Icon, Grid } from "@mui/material";
import { Links } from "@/components/admin/Links";
import { Pages } from "@mui/icons-material";
import { ExternalLinks } from "@/components/admin/video/ExternalLinks";
import { Services } from "@/components/admin/video/Services";
import { Tabs } from "@/components/admin/video/Tabs";

export default function Admin(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, []);

  //Add back pages
  return (
    <AdminWrapper config={props.config}>
      <h1><Icon>live_tv</Icon> Stream Settings</h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <Services />
        </Grid>
        <Grid item md={4} xs={12}>
          <Links />
          <Tabs />
          <ExternalLinks churchId={props.config.church.id} />
        </Grid>
      </Grid>
    </AdminWrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
