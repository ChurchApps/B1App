"use client";

import React, { useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Typography } from "@mui/material";
import { type LinkInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToImage, linkTypeToIcon, linkTypeToRoute } from "./mobileTheme";
import { useChurchLinks } from "../hooks/useConfig";

interface Props {
  config: ConfigurationInterface;
}

export const DashboardPage = ({ config }: Props) => {
  const context = useContext(UserContext);
  const router = useRouter();
  const tc = mobileTheme.colors;
  const churchId = config?.church?.id;
  const jwt = context.userChurch?.jwt;

  const { data: rawLinks, isLoading } = useChurchLinks(churchId, jwt);

  const links = useMemo<LinkInterface[]>(() => {
    if (!Array.isArray(rawLinks)) return [];
    if (jwt) {
      const userGroupTags = context.userChurch?.groups?.flatMap((g: any) => g.tags?.split(",") || []) || [];
      return rawLinks.filter((l: any) => l.visibility !== "team" || userGroupTags.includes("team"));
    }
    return rawLinks.filter((l: any) => !l.visibility || l.visibility === "everyone");
  }, [rawLinks, jwt, context.userChurch?.groups]);

  const loading = isLoading && links.length === 0;

  const filtered = useMemo(
    () => links.filter((l) => l.linkType !== "separator"),
    [links]
  );

  const navigate = (link: LinkInterface) => {
    const route = linkTypeToRoute(link.linkType, link.linkData);
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
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: tc.background, minHeight: "100%", pt: 2, pb: 3 }}>
      {/* Hero Section */}
      {hero && (
        <Box sx={{ px: `${mobileTheme.spacing.md}px`, mb: 3 }}>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => navigate(hero)}
            sx={{
              position: "relative",
              height: 200,
              borderRadius: `${mobileTheme.radius.xl}px`,
              overflow: "hidden",
              boxShadow: cardShadow,
              cursor: "pointer",
              bgcolor: tc.primary,
              backgroundImage: `url(${linkTypeToImage(hero.linkType, hero.text)})`,
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
                key={item.id || `${item.linkType}-${item.text}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(item)}
                sx={{
                  flex: 1,
                  position: "relative",
                  height: 120,
                  borderRadius: `${mobileTheme.radius.lg}px`,
                  overflow: "hidden",
                  boxShadow: featuredShadow,
                  cursor: "pointer",
                  bgcolor: tc.primary,
                  backgroundImage: `url(${linkTypeToImage(item.linkType, item.text)})`,
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
                key={item.id || `${item.linkType}-${item.text}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(item)}
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
