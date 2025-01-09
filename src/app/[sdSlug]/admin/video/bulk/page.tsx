"use client";

import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import { ApiHelper, Banner, DisplayBox } from "@churchapps/apphelper";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { ConfigHelper, ConfigurationInterface } from "@/helpers/ConfigHelper";
import { VimeoImport } from "@/components/admin/video/VimeoImport";
import { YouTubeImport } from "@/components/admin/video/YouTubeImport";
import { Button, Grid } from "@mui/material";

type PageParams = {sdSlug:string }

export default function AdminPagesClient() {
  const { isAuthenticated } = ApiHelper;
  const [config, setConfig] = useState<ConfigurationInterface>(null);
  const params = useParams<PageParams>()
  const [importType, setImportType] = useState<"youtube" | "vimeo" | "">();


  const loadData = () => {
    ConfigHelper.load(params.sdSlug).then((data) => { setConfig(data); });
    
  };

  useEffect(() => {
    if (!isAuthenticated) redirect("/login");
    else loadData();
  }, [isAuthenticated]);



  return (
    <AdminWrapper config={config}>
      <Banner><h1>Bulk Import</h1></Banner>
      <div id="mainContent">
      {importType ? (<>
        {importType === "youtube"
          ? (<YouTubeImport handleDone={() => setImportType("")} />)
          : (<VimeoImport handleDone={() => setImportType("")} />)
        }
      </>) : (<>
        <DisplayBox headerText={"Import Source"}>
          <Grid container spacing={3}>
            <Grid item sm={6} textAlign={"center"} marginTop={5} marginBottom={5}>
              <Button size="large" variant="contained" onClick={() => setImportType("youtube")}>Import from YouTube</Button>
            </Grid>
            <Grid item sm={6} textAlign={"center"} marginTop={5} marginBottom={5}>
              <Button size="large" variant="contained" onClick={() => setImportType("vimeo")}>Import from Vimeo</Button>
            </Grid>
          </Grid>
        </DisplayBox>
      </>)}
      </div>
    </AdminWrapper>
  );
}