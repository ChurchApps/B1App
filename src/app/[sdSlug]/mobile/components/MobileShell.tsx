"use client";

import React, { useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { DesktopBack, MobileAppBar, MobileTopHeader, navLinks, routeSlug } from "./MobileAppBar";
import { MAX_LINK_TABS, MobileTabBar } from "./MobileTabBar";
import { WebPushEnrollmentSync } from "./WebPushEnrollmentSync";
import { ChatNotificationBridge } from "./ChatNotificationBridge";
import { mobileTheme } from "./mobileTheme";
import { MobileThemeProvider } from "./MobileThemeProvider";
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
  const context = useContext(UserContext);
  const router = useRouter();

  const jwt = context?.userChurch?.jwt;
  const { data: rawLinks } = useChurchLinks(config?.church?.id, jwt);
  const links = useMemo(
    () => filterVisibleLinks(rawLinks, jwt ? context?.userChurch : null),
    [rawLinks, jwt, context?.userChurch]
  );
  const rootSlugs = useMemo(() => ["dashboard", "more", ...navLinks(links, MAX_LINK_TABS).map((t) => routeSlug(t.route))], [links]);
  const goProfile = () => router.push("/mobile/profileEdit");

  return (
    <Box className="mobileAppRoot" sx={{ minHeight: "100vh", maxWidth: "100%", overflowX: "hidden", bgcolor: mobileTheme.colors.background, color: mobileTheme.colors.text }}>
      <WebPushEnrollmentSync />
      {jwt && <ChatNotificationBridge personId={context?.person?.id} churchId={context?.userChurch?.church?.id} />}

      <MobileAppBar churchName={config?.church?.name} rootSlugs={rootSlugs} onAvatarClick={goProfile} />
      <MobileTopHeader churchName={config?.church?.name} links={links} onAvatarClick={goProfile} />

      <Box component="main" sx={{
        pt: { xs: `calc(${mobileTheme.headerHeight}px + ${mobileTheme.safe.top})`, md: "28px" },
        pb: { xs: `calc(${mobileTheme.tabBarHeight + 20}px + ${mobileTheme.safe.bottom})`, md: "48px" },
        px: { xs: 0, md: "32px" },
        maxWidth: { md: mobileTheme.contentMaxWidth },
        mx: "auto",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <DesktopBack rootSlugs={rootSlugs} />
        {children}
      </Box>

      <MobileTabBar links={links} />
    </Box>
  );
};
