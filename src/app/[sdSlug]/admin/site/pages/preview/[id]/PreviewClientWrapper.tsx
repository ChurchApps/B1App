"use client";

import { useEffect, useState } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { ConfigHelper, PageInterface, WrapperPageProps } from "@/helpers";
import { ApiHelper } from "@churchapps/apphelper";
import type { LinkInterface } from "@churchapps/helpers";
import { SiteAdminWrapper } from "@/components/admin/SiteAdminWrapper";
import { Box, Button, Stack, Typography, Paper } from "@mui/material";
import { PageLinkEdit } from "@/components/admin/site/PageLinkEdit";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { PageHeader } from "@churchapps/apphelper";
import { Edit as EditIcon, Settings as SettingsIcon, Web as WebIcon } from "@mui/icons-material";

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
    if (linkId) ApiHelper.get("/links/" + linkId, "ContentApi").then((data: any) => setLink(data));
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
      <PageHeader
        icon={<WebIcon />}
        title="Website Preview"
        subtitle={`Previewing: ${props.pageData.title}`}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => redirect("/admin/site/pages/" + props.pageData.id)}
            sx={{
              color: '#FFF',
              borderColor: 'rgba(255,255,255,0.5)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#FFF',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Edit Content
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setShowSettings(true)}
            sx={{
              color: '#FFF',
              borderColor: 'rgba(255,255,255,0.5)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#FFF',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Page Settings
          </Button>
        </Stack>
      </PageHeader>

      <SiteAdminWrapper config={props.config}>
        {showSettings && <PageLinkEdit link={link} page={props.pageData} updatedCallback={handlePageUpdated} onDone={() => setShowSettings(false)} />}

        <Box sx={{ p: 3 }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'grey.200'
            }}
          >
            <Box
              sx={{
                backgroundColor: 'grey.50',
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="center">
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {props.pageData.title}
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ position: 'relative' }}>
              <iframe
                src={url}
                style={{
                  width: '100%',
                  height: '80vh',
                  minHeight: '600px',
                  border: 'none',
                  display: 'block'
                }}
              />
            </Box>
          </Paper>
        </Box>
      </SiteAdminWrapper>
    </AdminWrapper>
  );
}
