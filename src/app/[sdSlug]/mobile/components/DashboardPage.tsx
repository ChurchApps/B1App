"use client";

import React, { useCallback, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { type LinkInterface } from "@churchapps/helpers";
import { Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToIcon, linkTypeToRoute, linkTypeToTagline } from "./mobileTheme";
import { filterVisibleLinks, useChurchLinks } from "../hooks/useConfig";
import { useEngagementSort } from "../hooks/useEngagementSort";
import { EmptyDashboardPlaceholder } from "./EmptyDashboardPlaceholder";

interface Props {
  config: ConfigurationInterface;
}

const ENGAGEMENT_STORAGE_KEY = "b1app-link-view-counts";

const generateLinkId = (item: LinkInterface): string => item.id || `${item.linkType}_${item.text}`;

// Returns the admin-uploaded photo for this link, or null. Falling back to a
// stock B1 dashboard image makes every B1 install look identical at a distance,
// so unphotographed cards now render a themed gradient + icon instead.
const resolvePhoto = (item: LinkInterface): string | null => {
  const photo = (item as unknown as { photo?: string }).photo;
  return photo || null;
};

export const DashboardPage = ({ config }: Props) => {
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

  const loading = isLoading && links.length === 0;

  const getLinkId = useCallback((link: LinkInterface) => generateLinkId(link), []);
  const { sorted: filtered, increment: incrementViewCount } = useEngagementSort(
    links,
    ENGAGEMENT_STORAGE_KEY,
    getLinkId
  );

  const navigate = (link: LinkInterface) => {
    incrementViewCount(generateLinkId(link));
    const route = linkTypeToRoute(link.linkType, link.linkData, link.text, link.url);
    if (!route) return;
    if (route.startsWith("http")) {

      window.open(route, "_blank", "noopener,noreferrer");
    } else {
      router.push(route);
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

  if (filtered.length === 0) {
    return <EmptyDashboardPlaceholder config={config} />;
  }

  const handleKey = (e: React.KeyboardEvent, link: LinkInterface) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(link);
    }
  };

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", pt: 2, pb: 3 }}>

      {hero && (() => {
        const heroPhoto = resolvePhoto(hero);
        const heroIcon = linkTypeToIcon(hero.linkType, hero.icon);
        const heroTagline = linkTypeToTagline(hero.linkType);
        return (
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
                background: heroPhoto
                  ? `url(${heroPhoto}) center / cover`
                  : `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`
              }}
            >
              {!heroPhoto && (
                <Box sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Icon sx={{ fontSize: 96, color: "rgba(255,255,255,0.25)" }}>{heroIcon}</Icon>
                </Box>
              )}
              <Box sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: heroPhoto ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.25)",
                p: "20px"
              }}>
                <Typography sx={{
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 32,
                  lineHeight: 1.1,
                  mb: 0.5,
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                }}>
                  {hero.text}
                </Typography>
                {heroTagline && (
                  <Typography sx={{
                    color: "#FFFFFF",
                    opacity: 0.9,
                    fontSize: 16,
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                  }}>
                    {heroTagline}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        );
      })()}

      {featuredTwo.length > 0 && (
        <Box sx={{ px: `${mobileTheme.spacing.md}px`, mb: 3 }}>
          <Typography sx={{
            fontSize: 22,
            fontWeight: 600,
            color: tc.text,
            mb: 2,
            pl: 0.5
          }}>
            {Locale.label("mobile.components.featured")}
          </Typography>
          <Box sx={{ display: "flex", gap: `${mobileTheme.spacing.md - 4}px` }}>
            {featuredTwo.map((item) => {
              const photo = resolvePhoto(item);
              const itemIcon = linkTypeToIcon(item.linkType, item.icon);
              return (
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
                    background: photo
                      ? `url(${photo}) center / cover`
                      : `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`
                  }}
                >
                  {!photo && (
                    <Box sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Icon sx={{ fontSize: 56, color: "rgba(255,255,255,0.3)" }}>{itemIcon}</Icon>
                    </Box>
                  )}
                  <Box sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: photo ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.25)",
                    p: "12px"
                  }}>
                    <Typography sx={{
                      color: "#FFFFFF",
                      fontWeight: 600,
                      fontSize: 16,
                      textAlign: "center",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                    }}>
                      {item.text}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {others.length > 0 && (
        <Box sx={{ px: `${mobileTheme.spacing.md}px`, mb: 3 }}>
          <Typography sx={{
            fontSize: 22,
            fontWeight: 600,
            color: tc.text,
            mb: 2,
            pl: 0.5
          }}>
            {Locale.label("mobile.components.quickActions")}
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
                  "&:hover": { boxShadow: featuredShadow }
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
        </Box>
      )}
    </Box>
  );
};
