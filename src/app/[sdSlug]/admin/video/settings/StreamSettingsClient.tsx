"use client";

import { useState } from "react";
import {  PageInterface, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { Box, Typography, Stack, Grid, Button } from "@mui/material";
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
      {/* Modern Header */}
      <Box sx={{ backgroundColor: "var(--c1l2)", color: "#FFF", padding: "24px" }}>
        <Stack 
          direction={{ xs: "column", md: "row" }} 
          spacing={{ xs: 2, md: 4 }} 
          alignItems={{ xs: "flex-start", md: "center" }} 
          sx={{ width: "100%" }}
        >
          {/* Left side: Title and Icon */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <Box 
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: '12px', 
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LiveTvIcon sx={{ fontSize: 32, color: '#FFF' }} />
            </Box>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 0.5,
                  fontSize: { xs: '1.75rem', md: '2.125rem' }
                }}
              >
                Stream Settings
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: { xs: '0.875rem', md: '1rem' }
                }}
              >
                Manage your live streaming services and configuration
              </Typography>
            </Box>
          </Stack>
          
          {/* Right side: Tab Navigation */}
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ 
              flexShrink: 0,
              justifyContent: { xs: "flex-start", md: "flex-end" },
              width: { xs: "100%", md: "auto" }
            }}
          >
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
        </Stack>
      </Box>

      {/* Content Area */}
      <Box sx={{ p: 3 }}>
        {selectedTab === "pages" && editPage ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <PageEdit 
                page={editPage} 
                updatedCallback={() => {
                  setEditPage(null);
                  setRefreshKey(Math.random());
                }} 
                embedded={true} 
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              {/* Right sidebar can show additional options */}
            </Grid>
          </Grid>
        ) : (
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
