"use client";

import { useEffect, useState } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { ConfigHelper, GlobalStyleInterface, PageInterface, WrapperPageProps } from "@/helpers";
import { ApiHelper, ChurchInterface, LinkInterface, SmallButton } from "@churchapps/apphelper";
import { AdminSiteWrapper } from "@/components/admin/AdminSiteWrapper";
import { Grid } from "@mui/material";
import { PageLinkEdit } from "@/components/admin/site/PageLinkEdit";

interface Props extends WrapperPageProps {
  pageData: any;
  church: ChurchInterface;
  churchSettings: any;
  globalStyles: GlobalStyleInterface;
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
    ConfigHelper.clearCache(props.church.subDomain);
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
    <AdminSiteWrapper config={props.config}>
      {showSettings && <PageLinkEdit link={link} page={props.pageData} updatedCallback={handlePageUpdated} onDone={() => setShowSettings(false)} />}
      <div style={{ marginLeft: -22, marginTop: -30, marginRight: -22 }}>
        <div style={{ background: "#FFF", padding: 15 }}>
          <Grid container>
            <Grid item xs={3}>
              <SmallButton icon="edit" text="Edit Content" onClick={() => redirect("/admin/site/pages/" + props.pageData.id)} />
            </Grid>
            <Grid item xs={6} style={{ textAlign: "center" }}>
              <b>{props.pageData.title}</b>
              <br />
            </Grid>
            <Grid item xs={3} style={{ textAlign: "right" }}>
              <SmallButton icon="settings" text="Page Settings" onClick={() => setShowSettings(true)} />
            </Grid>
          </Grid>
        </div>
        <iframe src={url} style={{ width: "100%", height: "100vh" }} />
      </div>
    </AdminSiteWrapper>
  );
}
