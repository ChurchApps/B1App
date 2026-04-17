"use client";

import React, { useContext, useEffect, useState } from "react";
import { Box, Drawer, Toolbar } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { type LinkInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MobileAppBar } from "./MobileAppBar";
import { MobileDrawer } from "./MobileDrawer";
import { mobileTheme } from "./mobileTheme";

interface Props {
  config: ConfigurationInterface;
  children: React.ReactNode;
}

export const MobileShell = ({ config, children }: Props) => {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<LinkInterface[]>([]);
  const context = useContext(UserContext);
  const primaryColor = config?.appearance?.primaryColor || mobileTheme.colors.primary;
  const drawerWidth = mobileTheme.drawerWidth;

  useEffect(() => {
    const churchId = config?.church?.id;
    if (!churchId) return;
    const load = async () => {
      if (context.userChurch?.jwt) {
        try {
          const result = await ApiHelper.get(`/links/church/${churchId}/filtered?category=b1Tab`, "ContentApi");
          const userGroupTags = context.userChurch.groups?.flatMap((g: any) => g.tags?.split(",") || []) || [];
          const filtered = result.filter((link: any) => {
            if (link.visibility === "team") return userGroupTags.includes("team");
            return true;
          });
          setLinks(filtered);
          return;
        } catch { /* fall through */ }
      }
      const allLinks = await ApiHelper.getAnonymous(`/links/church/${churchId}?category=b1Tab`, "ContentApi");
      setLinks(allLinks.filter((l: any) => !l.visibility || l.visibility === "everyone"));
    };
    load();
  }, [config?.church?.id, context.userChurch?.jwt]);

  return (
    <Box
      className="mobileAppRoot"
      sx={{ display: "flex", minHeight: "100vh", bgcolor: mobileTheme.colors.background }}
      style={{ ["--mobile-primary" as string]: primaryColor } as React.CSSProperties}
    >
      <MobileAppBar
        config={config}
        primaryColor={primaryColor}
        drawerWidth={drawerWidth}
        onMenuClick={() => setOpen(true)}
        onAvatarClick={() => { window.location.href = "/mobile/profileEdit"; }}
        onBellClick={() => { window.location.href = "/mobile/notifications"; }}
      />

      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, bgcolor: mobileTheme.colors.surface },
        }}
      >
        <MobileDrawer config={config} links={links} onNavigate={() => setOpen(false)} />
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            bgcolor: mobileTheme.colors.surface,
            borderRight: `1px solid ${mobileTheme.colors.border}`,
          },
        }}
      >
        <MobileDrawer config={config} links={links} />
      </Drawer>

      <Box component="main" sx={{
        flexGrow: 1,
        minWidth: 0,
        width: { md: `calc(100% - ${drawerWidth}px)` },
        bgcolor: mobileTheme.colors.background,
      }}>
        <Toolbar sx={{ minHeight: `${mobileTheme.headerHeight}px !important` }} />
        {children}
      </Box>
    </Box>
  );
};
