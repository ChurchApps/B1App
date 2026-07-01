"use client";

import React, { useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { type LinkInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToIcon, linkTypeToRoute } from "../mobileTheme";
import { filterVisibleLinks, useChurchLinks } from "../../hooks/useConfig";
import { HOME_TABS_COUNT } from "../DashboardPage";

interface Props {
  config: ConfigurationInterface;
}

export const MoreCardsPage = ({ config }: Props) => {
  const context = useContext(UserContext);
  const router = useRouter();
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;
  const jwt = context.userChurch?.jwt;

  const { data: rawLinks, isLoading } = useChurchLinks(churchId, jwt);

  const links = useMemo<LinkInterface[]>(() => {
    const visible = filterVisibleLinks(rawLinks, context.userChurch);
    return visible.filter((l) => l.linkType !== "separator");
  }, [rawLinks, context.userChurch]);

  const remainingLinks = useMemo(() => {
    if (links.length <= HOME_TABS_COUNT) return [];
    return links.slice(HOME_TABS_COUNT);
  }, [links]);

  const navigate = (link: LinkInterface) => {
    const route = linkTypeToRoute(link.linkType, link.linkData, link.text, link.url);
    if (!route) return;
    if (link.linkType === "url" || route.startsWith("http")) {
      const target = route.startsWith("http") ? route : new URL(route, window.location.origin).toString();
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      router.push(route);
    }
  };

  const handleKey = (e: React.KeyboardEvent, link: LinkInterface) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(link);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, minHeight: "100%", bgcolor: tc.background }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: `${mobileTheme.spacing.md - 4}px` }}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ width: "calc(25% - 9px)", height: 96, bgcolor: tc.surfaceVariant, borderRadius: `${mobileTheme.radius.lg}px` }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, minHeight: "100%", bgcolor: tc.background }}>
      {remainingLinks.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: `${mobileTheme.spacing.md - 4}px` }}>
          {remainingLinks.map((item) => (
            <Box
              key={item.id || `${item.linkType}_${item.text}`}
              role="button"
              tabIndex={0}
              onClick={() => navigate(item)}
              onKeyDown={(e) => handleKey(e, item)}
              sx={{
                width: { xs: "calc(25% - 9px)", sm: "calc(20% - 10px)", md: "calc(16.666% - 10px)" },
                minWidth: 70,
                alignItems: "center",
                display: "flex",
                flexDirection: "column",
                p: "12px",
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                boxShadow: mobileTheme.shadows.sm,
                cursor: "pointer",
                "&:hover": { boxShadow: mobileTheme.shadows.md }
              }}
            >
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: "24px",
                bgcolor: tc.iconBackground,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 1
              }}>
                <Icon sx={{ fontSize: 24, color: tc.primary }}>{linkTypeToIcon(item.linkType, item.icon)}</Icon>
              </Box>
              <Typography sx={{
                color: tc.text,
                textAlign: "center",
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.2,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}>
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography sx={{ color: tc.textSecondary, textAlign: "center", mt: 4 }}>
          No more cards available.
        </Typography>
      )}
    </Box>
  );
};
