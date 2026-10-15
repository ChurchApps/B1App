"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { type LinkInterface } from "@churchapps/helpers";
import { Locale } from "@churchapps/apphelper";
import { mobileTheme, linkTypeToIcon, mobileSlugFromPath } from "./mobileTheme";
import { navLinks, routeSlug } from "./MobileAppBar";

export const MAX_LINK_TABS = 3;

export const MobileTabBar = ({ links }: { links: LinkInterface[] }) => {
  const pathname = usePathname();
  const slug = mobileSlugFromPath(pathname) || "dashboard";
  const tc = mobileTheme.colors;

  const tabs = [
    { key: "home", href: "/mobile/dashboard", icon: "home", label: Locale.label("mobile.components.home"), active: slug === "dashboard" },
    ...navLinks(links, MAX_LINK_TABS).map(({ link, route }) => ({ key: link.id || route, href: route, icon: linkTypeToIcon(link.linkType, link.icon), label: link.text || "", active: slug === routeSlug(route) })),
    { key: "more", href: "/mobile/more", icon: "more_horiz", label: Locale.label("mobile.components.more"), active: slug === "more" }
  ];

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
        pt: "6px",
        px: "4px",
        pb: `calc(8px + ${mobileTheme.safe.bottom})`,
        minHeight: `${mobileTheme.tabBarHeight}px`,
        zIndex: (theme) => theme.zIndex.appBar
      }}
    >
      {tabs.map((t) => (
        <Box
          key={t.key}
          component={Link}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            textDecoration: "none",
            color: t.active ? tc.onSelected : tc.textSecondary
          }}
        >
          <Box sx={{ width: 56, height: 30, borderRadius: 999, display: "grid", placeItems: "center", bgcolor: t.active ? tc.selected : "transparent" }}>
            <Icon sx={{ fontSize: 22 }}>{t.icon}</Icon>
          </Box>
          <Typography noWrap sx={{ fontSize: 11.5, fontWeight: t.active ? 650 : 500, lineHeight: 1, color: "inherit", maxWidth: "100%" }}>
            {t.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};
