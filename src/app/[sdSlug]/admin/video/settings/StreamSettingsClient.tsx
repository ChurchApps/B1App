"use client";

import { useState } from "react";
import {  PageInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Grid } from "@mui/material";
import { Links } from "@/components/admin/Links";
import { ExternalLinks } from "@/components/admin/video/ExternalLinks";
import { Services } from "@/components/admin/video/Services";
import { Tabs } from "@/components/admin/video/Tabs";
import { EmbeddablePages } from "@/components/admin/EmbeddablePages";
import { PageEdit } from "@/components/admin/PageEdit";
import { Banner } from "@churchapps/apphelper";

export function StreamSettingsClient(props: WrapperPageProps) {
  const [editPage, setEditPage] = useState<PageInterface>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AdminWrapper config={props.config}>
      <Banner><h1>Stream Settings</h1></Banner>
      <div id="mainContent">
        <Grid container spacing={3}>
          <Grid item md={8} xs={12}>
            <Services />
            <EmbeddablePages onSelected={(page: PageInterface) => setEditPage(page)} pathPrefix="/stream" refreshKey={refreshKey} />
          </Grid>
          <Grid item md={4} xs={12}>
            {editPage && (
              <PageEdit page={editPage} updatedCallback={() => {
                setEditPage(null);
                setRefreshKey(Math.random());
              }} embedded={true} />
            )}
            <Links category="streamingLink" />
            <Tabs />
            <ExternalLinks churchId={props.config.church.id} />
          </Grid>
        </Grid>
      </div>
    </AdminWrapper>
  );
}
