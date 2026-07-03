"use client";

import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Icon, Typography } from "@mui/material";
import { usePathname } from "next/navigation";
import { ApiHelper } from "@churchapps/apphelper";
import { StyleHelper } from "@churchapps/apphelper/website";
import Zone from "@/components/layouts/Zone";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { PageInterface } from "@/helpers";
import { UrlHelper } from "@/helpers";
import { useHydrateSession } from "@/app/[sdSlug]/mobile/hooks/useHydrateSession";

interface Props {
  config: ConfigurationInterface;
  pageUrl: string;
  siteId?: string;
}

type State = "loading" | "gate" | "content" | "denied";

export function RestrictedPage({ config, pageUrl, siteId = "" }: Props) {
  const status = useHydrateSession();
  const pathname = usePathname();
  const [state, setState] = useState<State>("loading");
  const [pageData, setPageData] = useState<PageInterface | null>(null);

  useEffect(() => {
    if (status === "anonymous" || status === "error") { setState("gate"); return; }
    if (status !== "ready") { setState("loading"); return; }
    let cancelled = false;
    ApiHelper.get("/pages/" + config.church.id + "/tree?url=" + pageUrl + (siteId ? "&siteId=" + siteId : ""), "ContentApi")
      .then((data: any) => {
        if (cancelled) return;
        if (!data || data.restricted) { setState("denied"); return; }
        setPageData(data);
        setState("content");
      })
      .catch(() => { if (!cancelled) setState("denied"); });
    return () => { cancelled = true; };
  }, [status, config.church.id, pageUrl, siteId]);

  if (state === "content" && pageData?.sections) {
    StyleHelper.getAllStyles(pageData.sections);
    const css = StyleHelper.getCss(pageData.sections);
    return (<>
      <style>{css}</style>
      <Zone church={config.church} sections={pageData.sections} zone="main" churchSettings={config.appearance} />
    </>);
  }

  const message = (icon: string, title: string, body?: React.ReactNode) => (
    <Box sx={{ maxWidth: 520, mx: "auto", my: 8, px: 3, textAlign: "center" }}>
      <Icon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}>{icon}</Icon>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{title}</Typography>
      {body}
    </Box>
  );

  if (state === "gate") {
    const loginHref = "/login?returnUrl=" + encodeURIComponent(UrlHelper.getReturnUrl(pathname, config.keyName));
    return message("lock", "This page is for church members", ( <Button variant="contained" href={loginHref} sx={{ mt: 2 }} data-testid="restricted-login-button">Login</Button>
    ));
  }

  if (state === "denied") return message("block", "You don't have access to this page");

  return (
    <Box sx={{ display: "flex", justifyContent: "center", my: 10 }}>
      <CircularProgress />
    </Box>
  );
}
