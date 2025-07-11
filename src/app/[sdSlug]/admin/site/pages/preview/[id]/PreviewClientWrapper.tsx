"use client";

import { useEffect, useState } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { ConfigHelper, PageInterface, WrapperPageProps } from "@/helpers";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { Banner } from "@churchapps/apphelper/dist/components/header/Banner";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import type { LinkInterface } from "@churchapps/helpers";
import { SiteAdminWrapper } from "@/components/admin/SiteAdminWrapper";
import { Grid } from "@mui/material";
import { PageLinkEdit } from "@/components/admin/site/PageLinkEdit";
import { AdminWrapper } from "@/components/admin/AdminWrapper";

interface Props extends WrapperPageProps {
  pageData: any;
}

export function PreviewClientWrapper(props: Props) {
  const url = props.pageData.url;
  const [showSettings, setShowSettings] = useState(false);
  const searchParams = useSearchParams();
  const [link, setLink] = useState<LinkInterface>(null);

  const loadData = () => {
    const linkId = searchParams.get("linkId");
    if (linkId) ApiHelper.get("/links/" + linkId, "ContentApi").then((data) => setLink(data));
  };

  const handlePageUpdated = (page: PageInterface, link: LinkInterface) => {
    ConfigHelper.clearCache("sdSlug=" + props.config?.church.subDomain);
    loadData();
    setShowSettings(false);
    if (!page) redirect("/admin/site");

    if (link) redirect(`/admin/site/pages/preview/${page.id}?linkId=${link.id}`);
    else redirect(`/admin/site/pages/preview/${page.id}`);
  };

  useEffect(() => {
    loadData();
  }, [searchParams.get("linkId")]);

  return (
    <AdminWrapper config={props.config}>
      <Banner><h1>Website</h1></Banner>
      <SiteAdminWrapper config={props.config}>
        {showSettings && <PageLinkEdit link={link} page={props.pageData} updatedCallback={handlePageUpdated} onDone={() => setShowSettings(false)} />}
        <div style={{ marginLeft: -22 }}>
          <div style={{ background: "#FFF", padding: 15 }}>
            <Grid container>
              <Grid size={{ xs: 3 }}>
                <SmallButton icon="edit" text="Edit Content" onClick={() => redirect("/admin/site/pages/" + props.pageData.id)} />
              </Grid>
              <Grid size={{ xs: 6 }} style={{ textAlign: "center" }}>
                <b>{props.pageData.title}</b>
                <br />
              </Grid>
              <Grid size={{ xs: 3 }} style={{ textAlign: "right" }}>
                <SmallButton icon="settings" text="Page Settings" onClick={() => setShowSettings(true)} />
              </Grid>
            </Grid>
          </div>
          <iframe src={url} style={{ width: "100%", height: "100vh" }} />
        </div>
      </SiteAdminWrapper>
    </AdminWrapper>
  );
}
