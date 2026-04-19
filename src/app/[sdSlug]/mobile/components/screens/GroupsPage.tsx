"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Skeleton, Typography, Button } from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { EventInterface, GroupInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
}

const ENGAGEMENT_STORAGE_KEY = "b1app-group-view-counts";

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

export const GroupsPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const loggedIn = !!UserHelper.user?.firstName;

  const { data: groups = null } = useQuery<GroupInterface[]>({
    queryKey: ["my-groups", UserHelper.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/groups/my", "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
  });

  const { data: upcomingEvents = [] } = useQuery<EventInterface[]>({
    queryKey: ["events-registerable", UserHelper.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/events/registerable", "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
  });

  // Force an empty-state render for logged-out users (match previous behavior).
  const effectiveGroups = loggedIn ? groups : [];

  // Engagement store — localStorage-backed view counts, hydrated once on mount.
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setViewCounts(readViewCounts());
  }, []);

  const incrementViewCount = useCallback((groupId: string) => {
    if (!groupId) return;
    setViewCounts((prev) => {
      const next = { ...prev, [groupId]: (prev[groupId] || 0) + 1 };
      writeViewCounts(next);
      return next;
    });
  }, []);

  // Sort descending by view count; ties preserve original (server) order.
  const sortedGroups = useMemo(() => {
    if (!Array.isArray(effectiveGroups) || effectiveGroups.length === 0) {
      return { hero: null as GroupInterface | null, featured: [] as GroupInterface[], regular: [] as GroupInterface[] };
    }
    const decorated = effectiveGroups.map((group, index) => ({
      group,
      index,
      count: viewCounts[group.id || ""] || 0,
    }));
    decorated.sort((a, b) => (a.count === b.count ? a.index - b.index : b.count - a.count));
    const ordered = decorated.map((d) => d.group);

    // Hero = top group; Featured grid = next 2-4; Regular = remainder.
    const hero = ordered[0] || null;
    const featured = ordered.slice(1, 5); // up to 4 featured
    const regular = ordered.slice(5);
    return { hero, featured, regular };
  }, [effectiveGroups, viewCounts]);

  const formatEventTime = (event: EventInterface) => {
    if (!event.start) return "";
    const start = new Date(event.start);
    if (isNaN(start.getTime())) return "";
    if (event.allDay) {
      return start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + " (All day)";
    }
    const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const fmtTime = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    if (!event.end) return `${fmtDate(start)} ${fmtTime(start)}`;
    const end = new Date(event.end);
    if (isNaN(end.getTime())) return `${fmtDate(start)} ${fmtTime(start)}`;
    if (start.toDateString() === end.toDateString()) {
      return `${fmtDate(start)} · ${fmtTime(start)} – ${fmtTime(end)}`;
    }
    return `${fmtDate(start)} ${fmtTime(start)} – ${fmtDate(end)} ${fmtTime(end)}`;
  };

  const handleClick = (group: GroupInterface) => {
    if (group.id) incrementViewCount(group.id);
    router.push(`/mobile/groups/${group.id}`);
  };

  const getInitial = (name?: string) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  const renderThumbnail = (group: GroupInterface) => {
    const common = {
      width: 48,
      height: 48,
      borderRadius: `${mobileTheme.radius.md}px`,
      flexShrink: 0,
      overflow: "hidden",
    } as const;
    if (group.photoUrl) {
      return (
        <Box
          component="img"
          src={group.photoUrl}
          alt={group.name || "Group"}
          sx={{ ...common, objectFit: "cover" }}
        />
      );
    }
    return (
      <Box
        sx={{
          ...common,
          bgcolor: tc.primaryLight,
          color: tc.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        {getInitial(group.name)}
      </Box>
    );
  };

  // Hero card — large, full-width, photo cover with gradient overlay.
  const renderHero = (group: GroupInterface) => {
    const hasPhoto = !!group.photoUrl;
    return (
      <Box
        key={`hero-${group.id}`}
        onClick={() => handleClick(group)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(group);
          }
        }}
        sx={{
          position: "relative",
          width: "100%",
          height: 200,
          borderRadius: `${mobileTheme.radius.xl}px`,
          overflow: "hidden",
          boxShadow: mobileTheme.shadows.md,
          cursor: "pointer",
          bgcolor: hasPhoto ? "transparent" : tc.primaryLight,
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": { boxShadow: mobileTheme.shadows.lg },
          "&:active": { transform: "scale(0.995)" },
        }}
      >
        {hasPhoto ? (
          <Box
            component="img"
            src={group.photoUrl}
            alt={group.name || "Group"}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon sx={{ fontSize: 72, color: tc.primary, opacity: 0.5 }}>groups</Icon>
          </Box>
        )}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            p: `${mobileTheme.spacing.md}px`,
            background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)",
          }}
        >
          <Typography sx={{ color: "#FFFFFF", fontSize: 24, fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
            {group.name}
          </Typography>
          <Typography sx={{ color: "#FFFFFF", opacity: 0.9, fontSize: 14, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
            Tap to explore
          </Typography>
        </Box>
      </Box>
    );
  };

  // Featured card — medium tile, photo cover with dark overlay + centered name.
  const renderFeatured = (group: GroupInterface) => {
    const hasPhoto = !!group.photoUrl;
    return (
      <Box
        key={`featured-${group.id}`}
        onClick={() => handleClick(group)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(group);
          }
        }}
        sx={{
          position: "relative",
          height: 120,
          borderRadius: `${mobileTheme.radius.lg}px`,
          overflow: "hidden",
          boxShadow: mobileTheme.shadows.sm,
          cursor: "pointer",
          bgcolor: hasPhoto ? "transparent" : tc.primaryLight,
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": { boxShadow: mobileTheme.shadows.md },
          "&:active": { transform: "scale(0.995)" },
        }}
      >
        {hasPhoto ? (
          <Box
            component="img"
            src={group.photoUrl}
            alt={group.name || "Group"}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon sx={{ fontSize: 40, color: tc.primary, opacity: 0.5 }}>groups</Icon>
          </Box>
        )}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            p: "12px",
            background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0) 100%)",
          }}
        >
          <Typography
            sx={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              textAlign: "center",
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {group.name}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Regular card — compact horizontal row (preserves prior design).
  const renderCard = (group: GroupInterface) => {
    const meetsSubtitle = [group.meetingTime, group.meetingLocation].filter(Boolean).join(" \u00B7 ");
    const memberCount = (group as any).memberCount;
    const subtitle = meetsSubtitle
      ? `Meets: ${meetsSubtitle}`
      : typeof memberCount === "number"
        ? `Members: ${memberCount}`
        : "";

    return (
      <Box
        key={group.id}
        onClick={() => handleClick(group)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick(group);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.md}px`,
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          px: `${mobileTheme.spacing.md}px`,
          py: "12px",
          cursor: "pointer",
          transition: "box-shadow 150ms ease, transform 150ms ease",
          "&:hover": { boxShadow: mobileTheme.shadows.md },
          "&:active": { transform: "scale(0.995)" },
        }}
      >
        {renderThumbnail(group)}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: tc.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {group.name}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 400,
                color: tc.textSecondary,
                mt: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
      </Box>
    );
  };

  const renderSkeleton = (key: number) => (
    <Box
      key={`skeleton-${key}`}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        px: `${mobileTheme.spacing.md}px`,
        py: "12px",
      }}
    >
      <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: `${mobileTheme.radius.md}px` }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={14} />
      </Box>
      <Skeleton variant="circular" width={20} height={20} />
    </Box>
  );

  const renderEmpty = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "32px",
          bgcolor: tc.iconBackground,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Icon sx={{ fontSize: 32, color: tc.primary }}>groups</Icon>
      </Box>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.xs}px` }}>
        You&apos;re not in any groups yet
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
        Find a group to connect with others in your church.
      </Typography>
      <Button
        variant="outlined"
        onClick={() => router.push("/mobile/community")}
        sx={{
          borderColor: tc.primary,
          color: tc.primary,
          textTransform: "none",
          fontWeight: 500,
          borderRadius: `${mobileTheme.radius.md}px`,
        }}
      >
        Explore Community
      </Button>
    </Box>
  );

  const { hero, featured, regular } = sortedGroups;
  const hasAnyGroups = effectiveGroups !== null && effectiveGroups.length > 0;

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {effectiveGroups === null && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
          {[0, 1, 2].map(renderSkeleton)}
        </Box>
      )}

      {effectiveGroups !== null && effectiveGroups.length === 0 && renderEmpty()}

      {hasAnyGroups && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.lg}px` }}>
          {/* Hero */}
          {hero && <Box>{renderHero(hero)}</Box>}

          {/* Featured grid — 2 columns */}
          {featured.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.sm}px`, pl: "4px" }}>
                Featured
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: `${mobileTheme.spacing.sm}px`,
                }}
              >
                {featured.map((g) => renderFeatured(g))}
              </Box>
            </Box>
          )}

          {/* Regular list */}
          {regular.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.sm}px`, pl: "4px" }}>
                Other Groups
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
                {regular.map(renderCard)}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {upcomingEvents.length > 0 && (
        <Box sx={{ mt: `${mobileTheme.spacing.lg}px` }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
            Upcoming Events
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
            {upcomingEvents.map((event) => (
              <Box
                key={event.id}
                sx={{
                  bgcolor: tc.surface,
                  borderRadius: `${mobileTheme.radius.lg}px`,
                  boxShadow: mobileTheme.shadows.sm,
                  p: `${mobileTheme.spacing.md}px`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: "20px",
                    bgcolor: tc.primaryLight,
                    color: tc.primary,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon sx={{ fontSize: 22 }}>event</Icon>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: 15, fontWeight: 600, color: tc.text,
                      overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {event.title}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: tc.textSecondary, mt: 0.25 }}>
                      {formatEventTime(event)}
                    </Typography>
                    {event.description && (
                      <Typography sx={{
                        fontSize: 13, color: tc.textMuted, mt: 0.5, lineHeight: 1.4,
                        overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                      }}>
                        {event.description}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => router.push(`/mobile/register/${event.id}`)}
                    sx={{
                      bgcolor: tc.success,
                      color: "#000",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: `${mobileTheme.radius.md}px`,
                      px: 2,
                      "&:hover": { bgcolor: tc.success },
                    }}
                  >
                    Register
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
