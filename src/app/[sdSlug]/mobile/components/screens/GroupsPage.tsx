"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Skeleton, Typography, Button } from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { EventInterface, GroupInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config?: ConfigurationInterface;
}

export const GroupsPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const [groups, setGroups] = React.useState<GroupInterface[] | null>(null);
  const [upcomingEvents, setUpcomingEvents] = React.useState<EventInterface[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    if (!UserHelper.user?.firstName) {
      setGroups([]);
      return;
    }
    // Endpoint matches /my/[pageSlug]/components/GroupsMasterPanel.tsx
    ApiHelper.get("/groups/my", "MembershipApi")
      .then((data: GroupInterface[]) => {
        if (!cancelled) setGroups(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      });
    ApiHelper.get("/events/registerable", "ContentApi")
      .then((data: EventInterface[]) => {
        if (!cancelled) setUpcomingEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setUpcomingEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        onClick={() => router.push("/mobile/groups")}
        sx={{
          borderColor: tc.primary,
          color: tc.primary,
          textTransform: "none",
          fontWeight: 500,
          borderRadius: `${mobileTheme.radius.md}px`,
        }}
      >
        Browse Groups
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
        My Groups
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
        {groups === null && [0, 1, 2].map(renderSkeleton)}
        {groups !== null && groups.length === 0 && renderEmpty()}
        {groups !== null && groups.length > 0 && groups.map(renderCard)}
      </Box>

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
