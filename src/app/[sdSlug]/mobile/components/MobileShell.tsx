"use client";

import React, { useContext, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Drawer, Toolbar } from "@mui/material";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MobileAppBar } from "./MobileAppBar";
import { MobileDrawer } from "./MobileDrawer";
import { MobileTabBar } from "./MobileTabBar";
import { WebPushEnrollmentSync } from "./WebPushEnrollmentSync";
import { ChatNotificationBridge } from "./ChatNotificationBridge";
import { mobileTheme, mobileSlugFromPath } from "./mobileTheme";
import { MobileThemeProvider, useMobileThemeMode } from "./MobileThemeProvider";
import { filterVisibleLinks, useChurchLinks } from "../hooks/useConfig";

interface Props {
  config: ConfigurationInterface;
  children: React.ReactNode;
}

export const MobileShell = (props: Props) => (
  <MobileThemeProvider config={props.config}>
    <MobileShellInner {...props} />
  </MobileThemeProvider>
);

const MobileShellInner = ({ config, children }: Props) => {
  const [open, setOpen] = useState(false);
  const context = useContext(UserContext);
  const router = useRouter();
  const { mode } = useMobileThemeMode();
  const themeMode = config?.appTheme?.[mode];
  const isValidColor = (value?: string | null) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test((value || "").trim());
  const primaryColor = isValidColor(themeMode?.primary)
    ? themeMode!.primary
    : (isValidColor(config?.appearance?.primaryColor) ? config!.appearance!.primaryColor! : mobileTheme.colors.primary);
  const drawerWidth = mobileTheme.drawerWidth;

  const jwt = context?.userChurch?.jwt;
  const { data: rawLinks } = useChurchLinks(config?.church?.id, jwt);
  const links = useMemo(
    () => filterVisibleLinks(rawLinks, jwt ? context?.userChurch : null),
    [rawLinks, jwt, context?.userChurch]
  );

  const pathname = usePathname();
  const slug = mobileSlugFromPath(pathname);
  const isDashboard = !slug || slug === "dashboard";

  return (
    <Box
      className="mobileAppRoot"
      sx={{ display: "flex", minHeight: "100vh", maxWidth: "100%", overflowX: "hidden", bgcolor: mobileTheme.colors.background }}
      style={{ ["--mobile-primary" as string]: primaryColor } as React.CSSProperties}
    >
      <WebPushEnrollmentSync />
      {jwt && <ChatNotificationBridge personId={context?.person?.id} churchId={context?.userChurch?.church?.id} />}

      <MobileAppBar
        config={config}
        drawerWidth={drawerWidth}
        onAvatarClick={() => router.push("/mobile/profileEdit")}
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
        bgcolor: mobileTheme.colors.background,
        pb: { xs: `calc(${mobileTheme.tabBarHeight}px + env(safe-area-inset-bottom))`, md: 0 }
      }}>
        {isDashboard
          ? <Box sx={{ height: "env(safe-area-inset-top)" }} />
          : <Toolbar sx={{ minHeight: `calc(${mobileTheme.headerHeight}px + env(safe-area-inset-top)) !important` }} />}
        {children}
      </Box>

      <MobileTabBar links={links} onMore={() => setOpen(true)} />
    </Box>
  );
};
