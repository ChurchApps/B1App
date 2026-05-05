"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Icon, IconButton, Skeleton, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { useQuery } from "@tanstack/react-query";
import type { EventInterface, GroupInterface, GroupMemberInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { navigateBack } from "../util";
import { GroupContact } from "@/components/groups/GroupContact";

interface Props {
  idOrSlug: string;
  config: ConfigurationInterface;
}

const looksLikeId = (value: string) => /^[A-Za-z0-9_]+$/.test(value) && !value.includes("-");

export const AnonymousGroupView = ({ idOrSlug, config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const churchId = config.church.id;

  const { data: group, isLoading: groupLoading } = useQuery<GroupInterface | null>({
    queryKey: ["group-public", churchId, idOrSlug],
    queryFn: async () => {
      const url = looksLikeId(idOrSlug)
        ? `/groups/public/${churchId}/${idOrSlug}`
        : `/groups/public/${churchId}/slug/${idOrSlug}`;
      const data = await ApiHelper.getAnonymous(url, "MembershipApi");
      return data || null;
    },
    enabled: !!idOrSlug && !!churchId
  });

  const groupId = group?.id;

  const { data: leaders = [] } = useQuery<GroupMemberInterface[]>({
    queryKey: ["group-leaders-public", churchId, groupId],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(
        `/groupMembers/public/leaders/${churchId}/${groupId}`,
        "MembershipApi"
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId
  });

  const { data: events = [] } = useQuery<EventInterface[]>({
    queryKey: ["group-events-public", churchId, groupId],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(
        `/events/public/group/${churchId}/${groupId}`,
        "ContentApi"
      );
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId
  });

  const upcomingEvents = React.useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((e) => e.start && new Date(e.start) > now)
      .sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime())
      .slice(0, 3);
  }, [events]);

  const handleBack = () => navigateBack(router, "/mobile/groups");

  const renderBack = () => (
    <IconButton
      aria-label={Locale.label("mobile.components.back")}
      onClick={handleBack}
      sx={{
        width: 40,
        height: 40,
        bgcolor: tc.surface,
        color: tc.text,
        boxShadow: mobileTheme.shadows.sm,
        mb: `${mobileTheme.spacing.md}px`,
        "&:hover": { bgcolor: tc.surface }
      }}
    >
      <Icon>arrow_back</Icon>
    </IconButton>
  );

  const renderHero = () => {
    const hasPhoto = !!group?.photoUrl;
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 220,
          borderRadius: "20px",
          overflow: "hidden",
          bgcolor: hasPhoto ? "transparent" : tc.primary,
          boxShadow: mobileTheme.shadows.lg
        }}
      >
        {hasPhoto ? (
          <Box
            component="img"
            src={group!.photoUrl}
            alt={group?.name || Locale.label("mobile.components.group")}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon sx={{ fontSize: 48, color: "#FFFFFF" }}>groups</Icon>
          </Box>
        )}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            px: "20px",
            py: "20px",
            background: "rgba(0,0,0,0.6)"
          }}
        >
          <Typography
            sx={{
              fontSize: 26,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.2,
              textShadow: "0 1px 3px rgba(0,0,0,0.4)"
            }}
          >
            {group?.name}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderAbout = () => {
    if (!group?.about && !group?.meetingTime && !group?.meetingLocation) return null;
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
          {Locale.label("mobile.details.about")}
        </Typography>
        {group?.about && (
          <Box
            sx={{
              fontSize: 14,
              color: tc.textMuted,
              lineHeight: 1.6,
              mb: 1,
              "& p": { mt: 0, mb: 1 },
              "& p:last-child": { mb: 0 },
              "& a": { color: tc.primary }
            }}
          >
            <MarkdownPreviewLight value={group.about} />
          </Box>
        )}
        {group?.meetingTime && (
          <Box sx={{ display: "flex", alignItems: "center", gap: `${mobileTheme.spacing.sm}px`, py: "6px" }}>
            <Icon sx={{ fontSize: 20, color: tc.primary }}>schedule</Icon>
            <Typography sx={{ fontSize: 14, color: tc.text }}>{group.meetingTime}</Typography>
          </Box>
        )}
        {group?.meetingLocation && (
          <Box sx={{ display: "flex", alignItems: "center", gap: `${mobileTheme.spacing.sm}px`, py: "6px" }}>
            <Icon sx={{ fontSize: 20, color: tc.primary }}>place</Icon>
            <Typography sx={{ fontSize: 14, color: tc.text }}>{group.meetingLocation}</Typography>
          </Box>
        )}
      </Box>
    );
  };

  const renderLeaders = () => {
    if (!leaders?.length) return null;
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
          {Locale.label("groupsPage.leaders")}
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: `${mobileTheme.spacing.md}px` }}>
          {leaders.map((l) => {
            const photo = l.person?.photo;
            return (
              <Box
                key={l.id}
                role="button"
                tabIndex={0}
                onClick={() => l.person?.id && router.push(`/mobile/community/${l.person.id}`)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && l.person?.id) {
                    e.preventDefault();
                    router.push(`/mobile/community/${l.person.id}`);
                  }
                }}
                sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
              >
                {photo ? (
                  <Box
                    component="img"
                    src={photo}
                    alt={l.person?.name?.display || ""}
                    sx={{ width: 40, height: 40, borderRadius: "20px", objectFit: "cover" }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "20px",
                      bgcolor: tc.primaryLight,
                      color: tc.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700
                    }}
                  >
                    <Icon>person</Icon>
                  </Box>
                )}
                <Typography sx={{ fontSize: 14, color: tc.text }}>{l.person?.name?.display}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderUpcomingEvents = () => {
    if (!upcomingEvents.length) return null;
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`
        }}
      >
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
          {Locale.label("groupsPage.calendarEvents")}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
          {upcomingEvents.map((e) => {
            const start = new Date(e.start!);
            const monthAbb = start.toLocaleString(undefined, { month: "short" });
            const dayShort = start.toLocaleString(undefined, { day: "2-digit" });
            return (
              <Box key={e.id} sx={{ display: "flex", alignItems: "center", gap: `${mobileTheme.spacing.md}px` }}>
                <Box
                  sx={{
                    width: 56,
                    minWidth: 56,
                    textAlign: "center",
                    bgcolor: tc.iconBackground,
                    color: tc.primary,
                    borderRadius: `${mobileTheme.radius.md}px`,
                    py: "6px",
                    fontWeight: 700
                  }}
                >
                  <Typography sx={{ fontSize: 12 }}>{monthAbb}</Typography>
                  <Typography sx={{ fontSize: 18 }}>{dayShort}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>{e.title}</Typography>
                  {e.description && (
                    <Typography sx={{ fontSize: 12, color: tc.textMuted, fontStyle: "italic" }}>
                      {e.description}
                    </Typography>
                  )}
                </Box>
                {e.registrationEnabled && e.id && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => router.push(`/mobile/register/${e.id}`)}
                    sx={{
                      bgcolor: tc.success,
                      color: "#000",
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: `${mobileTheme.radius.md}px`,
                      "&:hover": { bgcolor: tc.success }
                    }}
                  >
                    {Locale.label("mobile.group.register")}
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

  const renderContact = () => {
    if (!leaders?.length) return null;
    return (
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`
        }}
      >
        <GroupContact group={group!} leaders={leaders} config={config} />
      </Box>
    );
  };

  const renderNotFound = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.lg}px`,
        textAlign: "center"
      }}
    >
      <Icon sx={{ fontSize: 32, color: tc.primary, mb: 1 }}>groups</Icon>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
        {Locale.label("mobile.details.groupNotFound")}
      </Typography>
      <Button
        variant="outlined"
        onClick={() => router.push("/mobile/groups")}
        sx={{
          borderColor: tc.primary,
          color: tc.primary,
          textTransform: "none",
          borderRadius: `${mobileTheme.radius.md}px`
        }}
      >
        {Locale.label("mobile.details.backToGroups")}
      </Button>
    </Box>
  );

  const renderSkeleton = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      <Skeleton variant="rounded" sx={{ width: "100%", height: 220, borderRadius: `${mobileTheme.radius.lg}px` }} />
      <Box sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.lg}px`, p: `${mobileTheme.spacing.md}px` }}>
        <Skeleton variant="text" width="30%" height={24} />
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="85%" />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {renderBack()}
      {groupLoading && renderSkeleton()}
      {!groupLoading && !group && renderNotFound()}
      {group && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
          {renderHero()}
          {renderAbout()}
          {renderLeaders()}
          {renderUpcomingEvents()}
          {renderContact()}
        </Box>
      )}
    </Box>
  );
};

export default AnonymousGroupView;
