"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { type LinkInterface } from "@churchapps/helpers";
import { Locale } from "@churchapps/apphelper";
import { mobileTheme, linkTypeToIcon, linkTypeToRoute, mobileSlugFromPath } from "./mobileTheme";

interface Props {
  links: LinkInterface[];
  onMore: () => void;
}

const MAX_LINK_TABS = 3;

export const MobileTabBar = ({ links, onMore }: Props) => {
  const pathname = usePathname();
  const slug = mobileSlugFromPath(pathname);
  const tc = mobileTheme.colors;

  // votd is excluded because the dashboard verse card is its entry point.
  const tabLinks = links
    .filter((l) => l.linkType !== "separator" && l.linkType !== "url" && l.linkType !== "page" && l.linkType !== "votd")
    .map((l) => ({ link: l, route: linkTypeToRoute(l.linkType, l.linkData, l.text, l.url) }))
    .filter((t): t is { link: LinkInterface; route: string } => !!t.route && !t.route.startsWith("http"))
    .slice(0, MAX_LINK_TABS);

  const isActive = (route: string) => slug === route.split("?")[0].split("/").filter(Boolean).pop();

  const tabSx = (active: boolean) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "2px",
    py: "8px",
    minWidth: 0,
    cursor: "pointer",
    textDecoration: "none",
    color: active ? tc.primary : tc.textHint,
    border: "none",
    background: "transparent"
  });

  const label = (text: string, active: boolean) => (
    <Typography noWrap sx={{ fontSize: 10.5, fontWeight: active ? 700 : 600, lineHeight: 1.2, color: "inherit", maxWidth: "100%" }}>
      {text}
    </Typography>
  );

  return (
    <Box
      component="nav"
      aria-label={Locale.label("mobile.components.navigation")}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: "flex", md: "none" },
        alignItems: "stretch",
        bgcolor: tc.surface,
        borderTop: `1px solid ${tc.border}`,
        pb: "env(safe-area-inset-bottom)",
        minHeight: `${mobileTheme.tabBarHeight}px`,
        zIndex: (theme) => theme.zIndex.appBar
      }}
    >
      <Box component={Link} href="/mobile/dashboard" sx={tabSx(!slug || slug === "dashboard")}>
        <Icon sx={{ fontSize: 24 }}>home</Icon>
        {label(Locale.label("mobile.components.home"), !slug || slug === "dashboard")}
      </Box>
      {tabLinks.map(({ link, route }) => {
        const active = isActive(route);
        return (
          <Box key={link.id || route} component={Link} href={route} sx={tabSx(active)}>
            <Icon sx={{ fontSize: 24 }}>{linkTypeToIcon(link.linkType, link.icon)}</Icon>
            {label(link.text || "", active)}
          </Box>
        );
      })}
      <Box component="button" type="button" onClick={onMore} aria-label={Locale.label("mobile.components.openMenu")} sx={tabSx(false)}>
        <Icon sx={{ fontSize: 24 }}>more_horiz</Icon>
        {label(Locale.label("mobile.components.more"), false)}
      </Box>
    </Box>
  );
};
