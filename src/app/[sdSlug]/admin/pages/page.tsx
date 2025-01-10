"use client";

import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import { ApiHelper, Banner, UserHelper, Permissions } from "@churchapps/apphelper";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { PageInterface } from "@/helpers";
import { PageEdit } from "@/components/admin/PageEdit";
import { Grid } from "@mui/material";
import { EmbeddablePages } from "@/components/admin/EmbeddablePages";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const { isAuthenticated } = ApiHelper;
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const [editPage, setEditPage] = useState<PageInterface>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const params = useParams<PageParams>()

  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
  };

  useEffect(() => {
    if (!isAuthenticated) redirect("/login");
    else loadData();
  }, [isAuthenticated]);

  return (
    <AdminWrapper config={config}>
      <Banner><h1>Mobile App Settings</h1></Banner>
      <div id="mainContent">
        {editPage && (<PageEdit page={editPage} updatedCallback={() => { setEditPage(null); setRefreshKey(Math.random()) }} embedded={true} /> )}
        {UserHelper.checkAccess(Permissions.contentApi.content.edit)
        && <Grid item md={8} xs={12}>
          <EmbeddablePages onSelected={(page:PageInterface) => { setEditPage(page); } } pathPrefix="/member" refreshKey={refreshKey} />
        </Grid>
        }
      </div>
    </AdminWrapper>
  );
}
