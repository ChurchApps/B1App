"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Icon,
  IconButton,
  Skeleton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { GroupCalendarTab } from "../group/GroupCalendarTab";
import { GroupAttendanceTab } from "../group/GroupAttendanceTab";
import { GroupResourcesTab } from "../group/GroupResourcesTab";
import { GroupChatModal } from "../group/GroupChatModal";
import { CreateEventModal } from "../group/CreateEventModal";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

interface GroupMember {
  id: string;
  personId?: string;
  leader?: boolean;
  person?: {
    id: string;
    name?: { display?: string; first?: string; last?: string };
    photo?: string;
    contactInfo?: any;
    householdId?: string;
  };
}

interface GroupWithExtras extends GroupInterface {
  about?: string;
  meetingDay?: string;
  meetingTime?: string;
  meetingLocation?: string;
}

type TabKey = "about" | "messages" | "members" | "attendance" | "events" | "resources";

export const GroupDetail = ({ id, config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const [group, setGroup] = React.useState<GroupWithExtras | null | undefined>(undefined);
  const [members, setMembers] = React.useState<GroupMember[] | null>(null);
  const [joining, setJoining] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>("about");
  const [chatOpen, setChatOpen] = React.useState(false);
  const [createEvent, setCreateEvent] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!id) return;
    setGroup(undefined);
    setMembers(null);

    ApiHelper.get(`/groups/${id}`, "MembershipApi")
      .then((data: GroupWithExtras) => {
        if (!cancelled) setGroup(data || null);
      })
      .catch(() => {
        if (!cancelled) setGroup(null);
      });

    ApiHelper.get(`/groupmembers?groupId=${id}`, "MembershipApi")
      .then((data: GroupMember[]) => {
        if (!cancelled) setMembers(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const currentPersonId = UserHelper.person?.id;
  const myMembership = members?.find((m) => (m.personId || m.person?.id) === currentPersonId);
  const isMember = !!myMembership;
  const isLeader = !!myMembership?.leader;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/mobile/groups");
  };

  const handleMemberClick = (m: GroupMember) => {
    const pid = m.personId || m.person?.id;
    if (pid) router.push(`/mobile/community/${pid}`);
  };

  const handleLeave = async () => {
    if (!currentPersonId || !members) return;
    const mine = members.find((m) => (m.personId || m.person?.id) === currentPersonId);
    if (!mine?.id) return;
    setJoining(true);
    try {
      await ApiHelper.delete(`/groupmembers/${mine.id}`, "MembershipApi");
      setMembers(members.filter((m) => m.id !== mine.id));
    } finally {
      setJoining(false);
    }
  };

  const handleJoin = async () => {
    if (!currentPersonId) return;
    setJoining(true);
    try {
      await ApiHelper.post(
        "/groupmembers",
        [{ groupId: id, personId: currentPersonId }],
        "MembershipApi"
      );
      const fresh = await ApiHelper.get(`/groupmembers?groupId=${id}`, "MembershipApi");
      setMembers(Array.isArray(fresh) ? fresh : members || []);
    } finally {
      setJoining(false);
    }
  };

  const getMemberInitials = (m: GroupMember) => {
    const first = (m.person?.name?.first || m.person?.name?.display || "").trim();
    const last = (m.person?.name?.last || "").trim();
    const f = first.charAt(0).toUpperCase();
    const l = last.charAt(0).toUpperCase();
    return (f + l).trim() || "?";
  };

  const renderMemberAvatar = (m: GroupMember) => {
    const common = { width: 40, height: 40, borderRadius: "20px", flexShrink: 0, overflow: "hidden" } as const;
    if (m.person?.photo) {
      return (
        <Box
          component="img"
          src={m.person.photo}
          alt={m.person?.name?.display || "Member"}
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
          fontSize: 14,
        }}
      >
        {getMemberInitials(m)}
      </Box>
    );
  };

  const renderBack = () => (
    <IconButton
      aria-label="Back"
      onClick={handleBack}
      sx={{
        width: 40,
        height: 40,
        bgcolor: tc.surface,
        color: tc.text,
        boxShadow: mobileTheme.shadows.sm,
        mb: `${mobileTheme.spacing.md}px`,
        "&:hover": { bgcolor: tc.surface },
      }}
    >
      <Icon>arrow_back</Icon>
    </IconButton>
  );

  const renderHero = () => {
    const memberCount = members?.length ?? 0;
    const overlaySx = {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      p: `${mobileTheme.spacing.md}px`,
      background: "linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0))",
    } as const;
    if (group?.photoUrl) {
      return (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            paddingTop: "56.25%",
            borderRadius: `${mobileTheme.radius.lg}px`,
            overflow: "hidden",
            bgcolor: tc.primaryLight,
            boxShadow: mobileTheme.shadows.md,
          }}
        >
          <Box
            component="img"
            src={group.photoUrl}
            alt={group.name || "Group"}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Box sx={overlaySx}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
              {group?.name}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.9)", mt: "4px" }}>
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </Typography>
          </Box>
        </Box>
      );
    }
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          paddingTop: "56.25%",
          borderRadius: `${mobileTheme.radius.lg}px`,
          overflow: "hidden",
          bgcolor: tc.primary,
          boxShadow: mobileTheme.shadows.md,
        }}
      >
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon sx={{ fontSize: 48, color: "#FFFFFF" }}>groups</Icon>
        </Box>
        <Box sx={overlaySx}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
            {group?.name}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 400, color: "rgba(255,255,255,0.9)", mt: "4px" }}>
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderAbout = () => {
    const rows: { icon: string; label: string }[] = [];
    if (group?.meetingDay) rows.push({ icon: "event", label: group.meetingDay });
    if (group?.meetingTime) rows.push({ icon: "schedule", label: group.meetingTime });
    if (group?.meetingLocation) rows.push({ icon: "place", label: group.meetingLocation });
    const hasAbout = !!group?.about;

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
        {(hasAbout || rows.length > 0) && (
          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              p: `${mobileTheme.spacing.md}px`,
            }}
          >
            <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
              About
            </Typography>
            {hasAbout && (
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: tc.textMuted,
                  lineHeight: 1.6,
                  mb: rows.length ? `${mobileTheme.spacing.md}px` : 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                {group?.about}
              </Typography>
            )}
            {rows.map((r, idx) => (
              <Box
                key={`${r.icon}-${idx}`}
                sx={{ display: "flex", alignItems: "center", gap: `${mobileTheme.spacing.sm}px`, py: "6px" }}
              >
                <Icon sx={{ fontSize: 20, color: tc.primary }}>{r.icon}</Icon>
                <Typography sx={{ fontSize: 14, color: tc.text }}>{r.label}</Typography>
              </Box>
            ))}
          </Box>
        )}
        {!hasAbout && rows.length === 0 && (
          <Typography sx={{ fontSize: 14, color: tc.textMuted, textAlign: "center", p: 2 }}>
            No details yet.
          </Typography>
        )}
        {renderActions()}
      </Box>
    );
  };

  const renderMembersTab = () => (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
      }}
    >
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
        Members ({members?.length ?? 0})
      </Typography>
      {members === null &&
        [0, 1, 2].map((k) => (
          <Box
            key={`msk-${k}`}
            sx={{ display: "flex", alignItems: "center", gap: `${mobileTheme.spacing.md}px`, py: "4px", height: 48 }}
          >
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" width="50%" height={18} />
          </Box>
        ))}
      {members !== null && members.length === 0 && (
        <Typography sx={{ fontSize: 14, color: tc.textMuted }}>No members yet.</Typography>
      )}
      {members !== null &&
        members.map((m) => (
          <Box
            key={m.id}
            role="button"
            tabIndex={0}
            onClick={() => handleMemberClick(m)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleMemberClick(m);
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: `${mobileTheme.spacing.md}px`,
              height: 48,
              px: "4px",
              borderRadius: `${mobileTheme.radius.md}px`,
              cursor: "pointer",
              "&:hover": { bgcolor: tc.iconBackground },
            }}
          >
            {renderMemberAvatar(m)}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: tc.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.person?.name?.display || "Unknown"}
              </Typography>
              <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>
                {m.leader ? "Leader" : "Member"}
              </Typography>
            </Box>
            <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
          </Box>
        ))}
    </Box>
  );

  const renderActions = () => {
    if (!currentPersonId) return null;
    if (isMember) {
      return (
        <Button
          variant="outlined"
          color="error"
          fullWidth
          disabled={joining}
          onClick={handleLeave}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: `${mobileTheme.radius.md}px`,
            py: "10px",
          }}
        >
          Leave Group
        </Button>
      );
    }
    return (
      <Button
        variant="contained"
        fullWidth
        disabled={joining}
        onClick={handleJoin}
        sx={{
          bgcolor: tc.primary,
          color: tc.onPrimary,
          textTransform: "none",
          fontWeight: 600,
          borderRadius: `${mobileTheme.radius.md}px`,
          py: "10px",
          "&:hover": { bgcolor: tc.primary },
        }}
      >
        Join Group
      </Button>
    );
  };

  const renderSkeleton = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      <Skeleton
        variant="rounded"
        sx={{ width: "100%", paddingTop: "56.25%", borderRadius: `${mobileTheme.radius.lg}px` }}
      />
      <Box
        sx={{ bgcolor: tc.surface, borderRadius: `${mobileTheme.radius.lg}px`, p: `${mobileTheme.spacing.md}px` }}
      >
        <Skeleton variant="text" width="30%" height={24} />
        <Skeleton variant="text" width="95%" />
        <Skeleton variant="text" width="85%" />
      </Box>
    </Box>
  );

  const renderNotFound = () => (
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
        Group Not Found
      </Typography>
      <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: `${mobileTheme.spacing.md}px` }}>
        This group could not be found or you don&apos;t have permission to view it.
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
        Back to Groups
      </Button>
    </Box>
  );

  const availableTabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "about", label: "About", icon: "info" },
    { key: "members", label: "Members", icon: "group" },
    { key: "events", label: "Events", icon: "event" },
  ];
  if (isLeader) availableTabs.push({ key: "attendance", label: "Attendance", icon: "fact_check" });
  availableTabs.push({ key: "resources", label: "Resources", icon: "folder" });
  if (isMember) availableTabs.splice(1, 0, { key: "messages", label: "Messages", icon: "forum" });

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {renderBack()}
      {group === undefined && renderSkeleton()}
      {group === null && renderNotFound()}
      {group && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
          {renderHero()}

          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              overflow: "hidden",
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => {
                if (v === "messages") {
                  setChatOpen(true);
                  return;
                }
                setTab(v);
              }}
              variant="scrollable"
              scrollButtons={false}
              sx={{
                minHeight: 44,
                "& .MuiTabs-indicator": { backgroundColor: tc.primary, height: 3 },
                "& .MuiTab-root": {
                  minHeight: 44,
                  textTransform: "none",
                  fontWeight: 600,
                  color: tc.textSecondary,
                  minWidth: 80,
                },
                "& .Mui-selected": { color: `${tc.primary} !important` },
              }}
            >
              {availableTabs.map((t) => (
                <Tab
                  key={t.key}
                  value={t.key}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Icon sx={{ fontSize: 18 }}>{t.icon}</Icon>
                      <span>{t.label}</span>
                    </Box>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {tab === "about" && renderAbout()}
          {tab === "members" && renderMembersTab()}
          {tab === "events" && (
            <GroupCalendarTab
              groupId={id}
              isLeader={isLeader}
              onAddEvent={(dateIso) => setCreateEvent(dateIso)}
            />
          )}
          {tab === "attendance" && members !== null && (
            <GroupAttendanceTab
              groupId={id}
              members={(members || [])
                .filter((m) => m.person?.id)
                .map((m) => ({
                  id: m.id,
                  person: {
                    id: m.person!.id,
                    name: { display: m.person!.name?.display },
                    photo: m.person!.photo,
                  },
                }))}
            />
          )}
          {tab === "resources" && <GroupResourcesTab groupId={id} canEdit={isLeader} />}
        </Box>
      )}

      <GroupChatModal
        open={chatOpen}
        groupId={id}
        groupName={group?.name}
        onClose={() => setChatOpen(false)}
      />
      <CreateEventModal
        open={!!createEvent}
        groupId={id}
        initialDateIso={createEvent || undefined}
        onClose={() => setCreateEvent(null)}
        onSaved={() => {
          setCreateEvent(null);
          // GroupCalendarTab reloads on its own via month change; bump key by toggling tab
          setTab("about");
          setTimeout(() => setTab("events"), 0);
        }}
      />
    </Box>
  );
};

export default GroupDetail;
