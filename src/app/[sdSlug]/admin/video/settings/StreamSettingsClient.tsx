"use client";

import { useState } from "react";
import {  PageInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { PageHeader } from "@churchapps/apphelper";
import { Box, Stack, Grid, Button } from "@mui/material";
import { Settings as SettingsIcon, LiveTv as LiveTvIcon, ViewStream as ViewStreamIcon, PlayArrow as PlayArrowIcon } from "@mui/icons-material";
import { Links } from "@/components/admin/Links";
import { ExternalLinks } from "@/components/admin/video/ExternalLinks";
import { Services } from "@/components/admin/video/Services";
import { Tabs } from "@/components/admin/video/Tabs";
import { EmbeddablePages } from "@/components/admin/EmbeddablePages";
import { PageEdit } from "@/components/admin/PageEdit";

export function StreamSettingsClient(props: WrapperPageProps) {
  const [editPage, setEditPage] = useState<PageInterface>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTab, setSelectedTab] = useState("services");

  const tabs = [
    { key: "services", label: "Services", icon: <PlayArrowIcon /> },
    { key: "pages", label: "Pages", icon: <ViewStreamIcon /> },
    { key: "settings", label: "Settings", icon: <SettingsIcon /> }
  ];

  const getCurrentTabContent = () => {
    switch (selectedTab) {
      case "services":
        return <Services />;
      case "pages":
        return <EmbeddablePages onSelected={(page: PageInterface) => setEditPage(page)} pathPrefix="/stream" refreshKey={refreshKey} />;
      case "settings":
        return (
          <>
            <Links category="streamingLink" />
            <Tabs />
            <ExternalLinks churchId={props.config.church.id} />
          </>
        );
      default:
        return <Services />;
    }
  };

  return (
    <AdminWrapper config={props.config}>
      <PageHeader
        icon={<LiveTvIcon />}
        title="Stream Settings"
        subtitle="Manage your live streaming services and configuration"
      >
        <Stack direction="row" spacing={1}>
          {tabs.map((tab, index) => (
            <Button
              key={tab.key}
              variant={selectedTab === tab.key ? "contained" : "outlined"}
              startIcon={tab.icon}
              onClick={() => setSelectedTab(tab.key)}
              sx={{
                color: selectedTab === tab.key ? "var(--c1l2)" : "#FFF",
                backgroundColor: selectedTab === tab.key ? "#FFF" : "transparent",
                borderColor: selectedTab === tab.key ? "#FFF" : "rgba(255,255,255,0.5)",
                "&:hover": {
                  borderColor: "#FFF",
                  backgroundColor: selectedTab === tab.key ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.1)"
                }
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Stack>
      </PageHeader>

      {/* Content Area */}
      <Box sx={{ p: 3 }}>
        {selectedTab === "pages" && editPage
          ? (
            <PageEdit
              page={editPage}
              updatedCallback={() => {
                setEditPage(null);
                setRefreshKey(Math.random());
              }}
              embedded={true}
            />
          )
          : (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: selectedTab === "settings" ? 8 : 12 }}>
                {getCurrentTabContent()}
              </Grid>
              {selectedTab === "settings" && (
                <Grid size={{ xs: 12, md: 4 }}>
                  {/* Settings sidebar content */}
                </Grid>
              )}
            </Grid>
          )}
      </Box>
    </AdminWrapper>
  );
}
