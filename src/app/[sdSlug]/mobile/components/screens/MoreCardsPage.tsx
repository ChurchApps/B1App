"use client";

import React, { useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { type LinkInterface } from "@churchapps/helpers";
import { Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToIcon, linkTypeToRoute, linkTypeToTagline } from "../mobileTheme";
import { filterVisibleLinks, useChurchLinks } from "../../hooks/useConfig";
import { useEngagementSort } from "../../hooks/useEngagementSort";
import { dashboardBaseLinks, FEATURED_COUNT, splitExplore } from "../../helpers/dashboardLinks";

interface Props {
  config: ConfigurationInterface;
}

const ENGAGEMENT_STORAGE_KEY = "b1app-link-view-counts";

const generateLinkId = (item: LinkInterface): string => item.id || `${item.linkType}_${item.text}`;

export const MoreCardsPage = ({ config }: Props) => {
  const context = useContext(UserContext);
  const router = useRouter();
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;
  const jwt = context?.userChurch?.jwt;

  const { data: rawLinks, isLoading } = useChurchLinks(churchId, jwt);

  const links = useMemo<LinkInterface[]>(() => {
    const visible = filterVisibleLinks(rawLinks, context?.userChurch);
    return visible.filter((l) => l.linkType !== "separator");
  }, [rawLinks, context?.userChurch]);

  // Mirrors DashboardPage's partition so no link shows on both pages or neither.
  const rest = useMemo(() => dashboardBaseLinks(links).slice(FEATURED_COUNT), [links]);
  const getLinkId = useCallback((link: LinkInterface) => generateLinkId(link), []);
  const { sorted: sortedRest, increment: incrementViewCount } = useEngagementSort(
    rest,
    ENGAGEMENT_STORAGE_KEY,
    getLinkId
  );
  const { overflow: remainingLinks } = splitExplore(sortedRest);

  const navigate = (link: LinkInterface) => {
    incrementViewCount(generateLinkId(link));
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
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ height: 96, bgcolor: tc.surfaceVariant, borderRadius: `${mobileTheme.radius.lg}px` }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, minHeight: "100%", bgcolor: tc.background }}>
      {remainingLinks.length > 0 ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr" }, gap: "12px" }}>
          {remainingLinks.map((item) => {
            const tagline = linkTypeToTagline(item.linkType);
            return (
              <Box
                key={generateLinkId(item)}
                role="button"
                tabIndex={0}
                onClick={() => navigate(item)}
                onKeyDown={(e) => handleKey(e, item)}
                sx={{
                  bgcolor: tc.surface,
                  border: `1px solid ${tc.border}`,
                  borderRadius: `${mobileTheme.radius.lg}px`,
                  p: "14px",
                  cursor: "pointer",
                  "&:active": { transform: "scale(0.985)" },
                  transition: "transform 120ms ease"
                }}
              >
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "11px",
                  bgcolor: tc.iconBackground,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: "10px"
                }}>
                  <Icon sx={{ fontSize: 20, color: tc.primary }}>{linkTypeToIcon(item.linkType, item.icon)}</Icon>
                </Box>
                <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 650, color: tc.text }}>
                  {item.text}
                </Typography>
                {tagline && (
                  <Typography noWrap sx={{ fontSize: 11.5, color: tc.textSecondary, mt: "1px" }}>
                    {tagline}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ textAlign: "center", pt: 8, px: 3 }}>
          <Box sx={{
            width: 64,
            height: 64,
            borderRadius: "19px",
            bgcolor: tc.iconBackground,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2
          }}>
            <Icon sx={{ fontSize: 30, color: tc.primary }}>grid_view</Icon>
          </Box>
          <Typography sx={{ fontFamily: mobileTheme.fonts.serif, fontSize: 22, fontWeight: 600, color: tc.text, mb: 1 }}>
            {Locale.label("mobile.more.allOnDashboard")}
          </Typography>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => router.push("/mobile/dashboard")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/mobile/dashboard"); } }}
            sx={{
              display: "inline-block",
              mt: 1,
              px: "20px",
              py: "10px",
              borderRadius: "999px",
              bgcolor: tc.primary,
              color: tc.onPrimary,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            {Locale.label("mobile.components.home")}
          </Box>
        </Box>
      )}
    </Box>
  );
};
