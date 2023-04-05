import { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ApiHelper, ConfigHelper, PageInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Icon, Grid } from "@mui/material";
import { Links } from "@/components/admin/Links";
import { ExternalLinks } from "@/components/admin/video/ExternalLinks";
import { Services } from "@/components/admin/video/Services";
import { Tabs } from "@/components/admin/video/Tabs";
import { EmbeddablePages } from "@/components/admin/EmbeddablePages";
import { PageEdit } from "@/components/admin/PageEdit";

export default function Admin(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  const [editPage, setEditPage] = useState<PageInterface>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
          <EmbeddablePages onSelected={(page:PageInterface) => { setEditPage(page); } } pathPrefix="/stream" refreshKey={refreshKey} />
        </Grid>
        <Grid item md={4} xs={12}>
          {editPage && (<PageEdit page={editPage} updatedCallback={() => { setEditPage(null); setRefreshKey(Math.random()) }} embedded={true} /> )}
          <Links />
          <Tabs />
          <ExternalLinks churchId={props.config.church.id} />
        </Grid>
      </Grid>
    </AdminWrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
