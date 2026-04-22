"use client";

import React, { useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Drawer, Toolbar } from "@mui/material";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MobileAppBar } from "./MobileAppBar";
import { MobileDrawer } from "./MobileDrawer";
import { mobileTheme } from "./mobileTheme";
import { MobileThemeProvider } from "./MobileThemeProvider";
import { PushPermissionPrompt } from "./PushPermissionPrompt";
import { filterVisibleLinks, useChurchLinks } from "../hooks/useConfig";

interface Props {
  config: ConfigurationInterface;
  children: React.ReactNode;
}

export const MobileShell = (props: Props) => (
  <MobileThemeProvider appTheme={props.config?.appTheme}>
    <MobileShellInner {...props} />
  </MobileThemeProvider>
);

const MobileShellInner = ({ config, children }: Props) => {
  const [open, setOpen] = useState(false);
  const context = useContext(UserContext);
  const router = useRouter();
  const primaryColor = config?.appTheme?.light?.primary || config?.appearance?.primaryColor || mobileTheme.colors.primary;
  const primaryContrast = config?.appTheme?.light?.primaryContrast || "#FFFFFF";
  const drawerWidth = mobileTheme.drawerWidth;

  const jwt = context.userChurch?.jwt;
  const { data: rawLinks } = useChurchLinks(config?.church?.id, jwt);
  const links = useMemo(
    () => filterVisibleLinks(rawLinks, context.userChurch),
    [rawLinks, context.userChurch]
  );

  return (
    <Box
      className="mobileAppRoot"
      sx={{ display: "flex", minHeight: "100vh", bgcolor: mobileTheme.colors.background }}
      style={{ ["--mobile-primary" as string]: primaryColor } as React.CSSProperties}
    >
      <MobileAppBar
        config={config}
        primaryColor={primaryColor}
        primaryContrast={primaryContrast}
        drawerWidth={drawerWidth}
        onMenuClick={() => setOpen(true)}
        onAvatarClick={() => router.push("/mobile/profileEdit")}
        onBellClick={() => router.push("/mobile/notifications")}
      />

      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, bgcolor: mobileTheme.colors.surface }
        }}
      >
        <MobileDrawer links={links} onNavigate={() => setOpen(false)} />
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
            borderRight: `1px solid ${mobileTheme.colors.border}`
          }
        }}
      >
        <MobileDrawer links={links} />
      </Drawer>

      <Box component="main" sx={{
        flexGrow: 1,
        minWidth: 0,
        width: { md: `calc(100% - ${drawerWidth}px)` },
        bgcolor: mobileTheme.colors.background
      }}>
        <Toolbar sx={{ minHeight: `${mobileTheme.headerHeight}px !important` }} />
        {children}
      </Box>
      <PushPermissionPrompt />
    </Box>
  );
};
