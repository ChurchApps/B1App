"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { MarkdownPreviewLight } from "@churchapps/apphelper-markdown";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GroupInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { getInitials } from "../util";
import { GroupCalendarTab, type EventRow } from "../group/GroupCalendarTab";
import { GroupAttendanceTab } from "../group/GroupAttendanceTab";
import { GroupResourcesTab } from "../group/GroupResourcesTab";
import { GroupChatModal, type ChatSubTab } from "../group/GroupChatModal";
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
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [joining, setJoining] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>("about");
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatInitialTab, setChatInitialTab] = React.useState<ChatSubTab>("discussions");
  const [createEvent, setCreateEvent] = React.useState<string | null>(null);
  const [editEvent, setEditEvent] = React.useState<EventRow | null>(null);

  // Deep-link param handling: activeTab, openChat, chatTab
  React.useEffect(() => {
    if (!searchParams) return;
    const activeTabParam = searchParams.get("activeTab");
    if (activeTabParam) {
      const allowed: TabKey[] = ["about", "messages", "members", "attendance", "events", "resources"];
      if ((allowed as string[]).includes(activeTabParam)) {
        if (activeTabParam === "messages") {
          setChatOpen(true);
        } else {
          setTab(activeTabParam as TabKey);
        }
      }
    }
    const openChatParam = searchParams.get("openChat");
    if (openChatParam === "1" || openChatParam === "true") {
      const chatTabParam = searchParams.get("chatTab");
      setChatInitialTab(chatTabParam === "announcements" ? "announcements" : "discussions");
      setChatOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: groupData, isLoading: groupLoading } = useQuery<GroupWithExtras | null>({
    queryKey: ["group-detail", id],
    queryFn: async () => {
      const data = await ApiHelper.get(`/groups/${id}`, "MembershipApi");
      return data || null;
    },
    enabled: !!id,
  });

  const { data: membersData = null } = useQuery<GroupMember[]>({
    queryKey: ["group-members", id],
    queryFn: async () => {
      const data = await ApiHelper.get(`/groupmembers?groupId=${id}`, "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!id,
  });

  const group: GroupWithExtras | null | undefined = groupLoading ? undefined : (groupData ?? null);
  const members = membersData;

  const refreshMembers = () => queryClient.invalidateQueries({ queryKey: ["group-members", id] });

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
      refreshMembers();
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
      refreshMembers();
    } finally {
      setJoining(false);
    }
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
        {getInitials(m.person)}
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
    const hasPhoto = !!group?.photoUrl;
    const overlaySx = {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      px: "20px",
      py: "20px",
      background: "rgba(0,0,0,0.6)",
    } as const;
    const chipSx = {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      bgcolor: "rgba(255,255,255,0.9)",
      color: "#000",
      fontSize: 12,
      fontWeight: 600,
      px: "8px",
      py: "4px",
      borderRadius: "12px",
    } as const;
    const leaderChipSx = { ...chipSx, bgcolor: "rgba(255,193,7,0.9)" } as const;

    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 220,
          borderRadius: "20px",
          overflow: "hidden",
          bgcolor: hasPhoto ? "transparent" : tc.primary,
          boxShadow: mobileTheme.shadows.lg,
        }}
      >
        {hasPhoto ? (
          <Box
            component="img"
            src={group!.photoUrl}
            alt={group?.name || "Group"}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon sx={{ fontSize: 48, color: "#FFFFFF" }}>groups</Icon>
          </Box>
        )}
        <Box sx={overlaySx}>
          <Typography
            sx={{
              fontSize: 26,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.2,
              mb: "12px",
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
            }}
          >
            {group?.name}
          </Typography>
          <Box sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Box sx={chipSx}>
              <Icon sx={{ fontSize: 14 }}>group</Icon>
              <span>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </Box>
            {isLeader && (
              <Box sx={leaderChipSx}>
                <Icon sx={{ fontSize: 14 }}>workspace_premium</Icon>
                <span>Leader</span>
              </Box>
            )}
          </Box>
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
              <Box
                sx={{
                  fontSize: 14,
                  color: tc.textMuted,
                  lineHeight: 1.6,
                  mb: rows.length ? `${mobileTheme.spacing.md}px` : 0,
                  "& p": { mt: 0, mb: 1 },
                  "& p:last-child": { mb: 0 },
                  "& a": { color: tc.primary },
                  "& h1, & h2, & h3, & h4": { color: tc.text, fontWeight: 700, mt: 1, mb: 0.5 },
                  "& ul, & ol": { pl: 3, mt: 0, mb: 1 },
                }}
              >
                <MarkdownPreviewLight value={group?.about || ""} />
              </Box>
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
  ];
  if (isMember) availableTabs.push({ key: "messages", label: "Messages", icon: "forum" });
  availableTabs.push({ key: "members", label: "Members", icon: "group" });
  if (isLeader) availableTabs.push({ key: "attendance", label: "Attendance", icon: "fact_check" });
  availableTabs.push({ key: "events", label: "Events", icon: "event" });
  availableTabs.push({ key: "resources", label: "Resources", icon: "folder" });

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
                  setChatInitialTab("discussions");
                  setChatOpen(true);
                  return;
                }
                setTab(v);
              }}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{
                minHeight: 52,
                "& .MuiTabs-indicator": { backgroundColor: tc.primary, height: 2 },
                "& .MuiTab-root": {
                  minHeight: 52,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: 14,
                  color: tc.textSecondary,
                },
                "& .Mui-selected": { color: `${tc.primary} !important`, fontWeight: 700 },
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
              onEditEvent={(ev) => setEditEvent(ev)}
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
        isLeader={isLeader}
        initialSubTab={chatInitialTab}
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
      <CreateEventModal
        open={!!editEvent}
        groupId={id}
        event={editEvent as any}
        onClose={() => setEditEvent(null)}
        onSaved={() => {
          setEditEvent(null);
          setTab("about");
          setTimeout(() => setTab("events"), 0);
        }}
      />
    </Box>
  );
};

export default GroupDetail;
