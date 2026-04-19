"use client";

import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, IconButton, Typography } from "@mui/material";
import { type LinkInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToImage, linkTypeToIcon, linkTypeToRoute } from "./mobileTheme";
import { useChurchLinks } from "../hooks/useConfig";

interface Props {
  config: ConfigurationInterface;
}

const ENGAGEMENT_STORAGE_KEY = "b1app-link-view-counts";

const readViewCounts = (): Record<string, number> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeViewCounts = (counts: Record<string, number>) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(counts));
  } catch {
    /* ignore quota / private-mode failures */
  }
};

const generateLinkId = (item: LinkInterface): string => item.id || `${item.linkType}_${item.text}`;

const resolvePhoto = (item: LinkInterface): string => {
  const photo = (item as unknown as { photo?: string }).photo;
  if (photo) return photo;
  return linkTypeToImage(item.linkType, item.text);
};

export const DashboardPage = ({ config }: Props) => {
  const context = useContext(UserContext);
  const router = useRouter();
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;
  const jwt = context.userChurch?.jwt;

  const { data: rawLinks, isLoading, refetch, isFetching } = useChurchLinks(churchId, jwt);

  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // Hydrate view counts from localStorage once on mount.
  useEffect(() => {
    setViewCounts(readViewCounts());
  }, []);

  // Re-fetch on window focus (web equivalent of pull-to-refresh).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => { refetch(); };
    window.addEventListener("focus", handler);
    return () => { window.removeEventListener("focus", handler); };
  }, [refetch]);

  const incrementViewCount = useCallback((linkId: string) => {
    setViewCounts((prev) => {
      const next = { ...prev, [linkId]: (prev[linkId] || 0) + 1 };
      writeViewCounts(next);
      return next;
    });
  }, []);

  const links = useMemo<LinkInterface[]>(() => {
    if (!Array.isArray(rawLinks)) return [];
    if (jwt) {
      const userGroupTags = context.userChurch?.groups?.flatMap((g: any) => g.tags?.split(",") || []) || [];
      return rawLinks.filter((l: any) => l.visibility !== "team" || userGroupTags.includes("team"));
    }
    return rawLinks.filter((l: any) => !l.visibility || l.visibility === "everyone");
  }, [rawLinks, jwt, context.userChurch?.groups]);

  const loading = isLoading && links.length === 0;

  const filtered = useMemo(() => {
    const list = links.filter((l) => l.linkType !== "separator");
    // Stable sort descending by view count, ties preserve original order.
    return list
      .map((link, index) => ({ link, index, count: viewCounts[generateLinkId(link)] || 0 }))
      .sort((a, b) => (a.count === b.count ? a.index - b.index : b.count - a.count))
      .map((entry) => entry.link);
  }, [links, viewCounts]);

  const navigate = (link: LinkInterface) => {
    incrementViewCount(generateLinkId(link));
    const route = linkTypeToRoute(link.linkType, link.linkData, link.text);
    if (route) {
      if (route.startsWith("http")) window.location.href = route;
      else router.push(route);
    }
  };

  const featured = filtered.slice(0, 3);
  const hero = featured[0];
  const featuredTwo = featured.slice(1, 3);
  const others = filtered.slice(3);

  const cardShadow = mobileTheme.shadows.lg;
  const featuredShadow = mobileTheme.shadows.md;
  const quickShadow = mobileTheme.shadows.sm;

  if (loading) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px` }}>
        <Box sx={{ bgcolor: tc.surfaceVariant, height: 200, borderRadius: `${mobileTheme.radius.xl}px`, mb: 3 }} />
        <Box sx={{ display: "flex", gap: `${mobileTheme.spacing.md - 4}px`, mb: 3 }}>
          <Box sx={{ flex: 1, bgcolor: tc.surfaceVariant, height: 120, borderRadius: `${mobileTheme.radius.lg}px` }} />
          <Box sx={{ flex: 1, bgcolor: tc.surfaceVariant, height: 120, borderRadius: `${mobileTheme.radius.lg}px` }} />
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: `${mobileTheme.spacing.md - 4}px`, px: `${mobileTheme.spacing.md}px` }}>
          {[0, 1, 2, 3].map((i) => (
            <Box key={i} sx={{ width: "calc(25% - 9px)", height: 96, bgcolor: tc.surfaceVariant, borderRadius: `${mobileTheme.radius.lg}px` }} />
          ))}
        </Box>
      </Box>
    );
  }

  const handleKey = (e: React.KeyboardEvent, link: LinkInterface) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(link);
    }
  };

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", pt: 2, pb: 3 }}>
      {/* Refresh button (web equivalent of pull-to-refresh) */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", px: `${mobileTheme.spacing.md}px`, mb: 1 }}>
        <IconButton
          size="small"
          aria-label="Refresh"
          onClick={() => { refetch(); }}
          disabled={isFetching}
          sx={{ color: tc.primary }}
        >
          <Icon sx={{ fontSize: 20 }}>refresh</Icon>
        </IconButton>
      </Box>

      {/* Hero Section */}
      {hero && (
        <Box sx={{ px: `${mobileTheme.spacing.md}px`, mb: 3 }}>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => navigate(hero)}
            onKeyDown={(e) => handleKey(e, hero)}
            sx={{
              position: "relative",
              height: 200,
              borderRadius: `${mobileTheme.radius.xl}px`,
              overflow: "hidden",
              boxShadow: cardShadow,
              cursor: "pointer",
              bgcolor: tc.primary,
              backgroundImage: `url(${resolvePhoto(hero)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <Box sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: "rgba(0,0,0,0.5)",
              p: "20px",
            }}>
              <Typography sx={{
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 32,
                lineHeight: 1.1,
                mb: 0.5,
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}>
                {hero.text}
              </Typography>
              <Typography sx={{
                color: "#FFFFFF",
                opacity: 0.9,
                fontSize: 16,
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}>
                Tap to explore
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Featured */}
      {featuredTwo.length > 0 && (
        <Box sx={{ px: `${mobileTheme.spacing.md}px`, mb: 3 }}>
          <Typography sx={{
            fontSize: 22,
            fontWeight: 600,
            color: tc.text,
            mb: 2,
            pl: 0.5,
          }}>
            Featured
          </Typography>
          <Box sx={{ display: "flex", gap: `${mobileTheme.spacing.md - 4}px` }}>
            {featuredTwo.map((item) => (
              <Box
                key={generateLinkId(item)}
                role="button"
                tabIndex={0}
                onClick={() => navigate(item)}
                onKeyDown={(e) => handleKey(e, item)}
                sx={{
                  flex: 1,
                  position: "relative",
                  height: 120,
                  borderRadius: `${mobileTheme.radius.lg}px`,
                  overflow: "hidden",
                  boxShadow: featuredShadow,
                  cursor: "pointer",
                  bgcolor: tc.primary,
                  backgroundImage: `url(${resolvePhoto(item)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <Box sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  bgcolor: "rgba(0,0,0,0.6)",
                  p: "12px",
                }}>
                  <Typography sx={{
                    color: "#FFFFFF",
                    fontWeight: 600,
                    fontSize: 16,
                    textAlign: "center",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}>
                    {item.text}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Quick Actions */}
      {others.length > 0 && (
        <Box sx={{ px: `${mobileTheme.spacing.md}px`, mb: 3 }}>
          <Typography sx={{
            fontSize: 22,
            fontWeight: 600,
            color: tc.text,
            mb: 2,
            pl: 0.5,
          }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: `${mobileTheme.spacing.md - 4}px` }}>
            {others.map((item) => (
              <Box
                key={generateLinkId(item)}
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
                  boxShadow: quickShadow,
                  cursor: "pointer",
                  "&:hover": { boxShadow: featuredShadow },
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
                  mb: 1,
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
                  overflow: "hidden",
                }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
