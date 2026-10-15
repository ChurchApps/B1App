"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Skeleton, Snackbar, Typography } from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LinkIcon from "@mui/icons-material/Link";
import { ApiHelper, DateHelper, Locale, PersonHelper, SUBSCRIPTION_MESSAGE_TYPE, UserHelper } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Permissions, type GroupInterface, type GroupJoinRequestInterface, type PersonInterface, type PlanInterface } from "@churchapps/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { getFirstDayOfWeek } from "@/helpers/firstDayOfWeek";
import { mobileTheme } from "../mobileTheme";
import { BackVerb, PageHead, PersonAvatar, Pill, PillRow, Plate, PlateSection, QuietEmpty, RecordLayout, Row, RowList, SearchField, Sheet, StatusBadge, TextLink, Thumb, useSliceView } from "../kit";
import { GroupCalendarTab, GroupNextEvent, type EventRow } from "../group/GroupCalendarTab";
import { GroupAttendanceTab } from "../group/GroupAttendanceTab";
import { GroupMeetingsList, MeetingNoteSheet, listedMeetings, toHtmlDate, type MeetingSession } from "../group/GroupMeetings";
import { GroupResourcesTab, ResourceRow, isHttpUrl, useGroupResources } from "../group/GroupResourcesTab";
import { GroupChatModal, type ChatSubTab } from "../group/GroupChatModal";
import { CreateEventModal } from "../group/CreateEventModal";
import { GroupPlansTab } from "../group/GroupPlansTab";
import { GroupLessonTakeHome } from "../group/GroupLessonTakeHome";
import { AnonymousGroupView } from "../group/AnonymousGroupView";
import { RequestToJoinDialog } from "./RequestToJoinDialog";

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
  // Chat feed toggles (ChurchAppsSupport#1054); absent means on.
  discussionsEnabled?: boolean;
  announcementsEnabled?: boolean;
  about?: string;
  meetingDay?: string;
  meetingTime?: string;
  meetingLocation?: string;
}

interface PreviewMessage {
  id?: string;
  personId?: string;
  content?: string;
  messageType?: string;
  timeSent?: string;
  name?: string;
}

type SliceKey = "events" | "members" | "messages" | "resources" | "plans" | "attendance" | "meetings";
const SLICES: SliceKey[] = ["events", "members", "messages", "resources", "plans", "attendance", "meetings"];

const tc = mobileTheme.colors;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const truncate = (s: string, max = 120) => (s.length > max ? s.slice(0, max - 1) + "…" : s);
const photoOf = (p?: GroupMember["person"]) => {
  if (!p?.photo) return undefined;
  try { return PersonHelper.getPhotoUrl(p as any); } catch { return undefined; }
};
const timeAgo = (t?: string) => {
  if (!t) return "";
  const d = new Date(t);
  if (isNaN(d.getTime())) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return Locale.label("mobile.now");
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
};

export const GroupDetail = ({ id, config }: Props) => {
  const isAuthenticated = !!UserHelper.user?.id;

  if (!isAuthenticated) {
    return <AnonymousGroupView idOrSlug={id} config={config} />;
  }

  return <AuthenticatedGroupDetail idOrSlug={id} config={config} />;
};

const AuthenticatedGroupDetail = ({ idOrSlug, config }: { idOrSlug: string; config: ConfigurationInterface }) => {
  // id is URL param (slug or real group id); derive resolved groupId from loaded group.
  const id = idOrSlug;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [view, setView] = useSliceView();
  const churchId = config.church.id;
  const [joining, setJoining] = React.useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = React.useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [chatInitialTab, setChatInitialTab] = React.useState<ChatSubTab>("discussions");
  const [createEvent, setCreateEvent] = React.useState<string | null>(null);
  const [editEvent, setEditEvent] = React.useState<EventRow | null>(null);
  const [memberSearch, setMemberSearch] = React.useState("");
  const [attendanceDate, setAttendanceDate] = React.useState<string | undefined>();
  const [noteDate, setNoteDate] = React.useState<string | null>(null);

  // Legacy deep links (?activeTab=…, ?openChat=1&chatTab=…) land on the matching ?view= slice.
  React.useEffect(() => {
    if (!searchParams) return;
    const activeTab = searchParams.get("activeTab");
    const openChat = searchParams.get("openChat");
    if (!activeTab && !openChat) return;
    const params = new URLSearchParams(searchParams.toString());
    ["activeTab", "openChat", "chatTab"].forEach((k) => params.delete(k));
    let next = "";
    if (openChat === "1" || openChat === "true") {
      setChatInitialTab(searchParams.get("chatTab") === "announcements" ? "announcements" : "discussions");
      next = "messages";
    } else if (activeTab && (SLICES as string[]).includes(activeTab)) {
      next = activeTab;
    }
    if (next) params.set("view", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname || "/mobile/groups");
  }, []);

  const isValidGroup = (data: any): data is GroupWithExtras =>
    !!data && typeof data === "object" && !!data.id;

  const { data: groupData, isLoading: groupLoading } = useQuery<GroupWithExtras | null>({
    queryKey: ["group-detail", id],
    queryFn: async () => {
      // `id` may be a real group id (shortIds can contain '-' or '_') or a slug, so
      // we can't tell them apart by shape — try id forms first, then the slug lookup.
      const tryGet = async (url: string) => {
        try {
          const d = await ApiHelper.get(url, "MembershipApi");
          return isValidGroup(d) ? d : null;
        } catch {
          return null;
        }
      };
      return (
        (await tryGet(`/groups/${id}`)) ||
        (await tryGet(`/groups/public/${churchId}/${id}`)) ||
        (await tryGet(`/groups/public/${churchId}/slug/${id}`))
      );
    },
    enabled: !!id && !!churchId
  });

  const groupId = groupData?.id;

  const { data: membersData = null, isError: membersUnavailable, isFetched: membersSettled } = useQuery<GroupMember[]>({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/groupmembers?groupId=${groupId}`, "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId
  });

  const { data: groupPlans = [] } = useQuery<PlanInterface[]>({
    queryKey: ["group-plans", groupId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/groups/${groupId}/plans`, "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId,
    placeholderData: []
  });

  const { data: myJoinRequests = [], refetch: refetchMyRequests, isFetched: requestsSettled } = useQuery<GroupJoinRequestInterface[]>({
    queryKey: ["my-join-requests"],
    queryFn: async () => {
      const data = await ApiHelper.get("/groupjoinrequests/my", "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!UserHelper.user?.id
  });

  const hasPlans = (groupPlans?.length || 0) > 0;

  const group: GroupWithExtras | null | undefined = groupLoading ? undefined : (groupData ?? null);

  React.useEffect(() => {
    if (group === null) {
      router.replace("/mobile/groups");
    }
  }, [group, router]);

  const members = membersData;

  const refreshMembers = () => queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });

  const currentPersonId = UserHelper.person?.id;
  const myMembership = members?.find((m) => (m.personId || m.person?.id) === currentPersonId);

  const seedGroup = groupId ? UserHelper.currentUserChurch?.groups?.find((g) => g.id === groupId) : undefined;
  const isMember = members !== null ? !!myMembership : !!seedGroup;
  const isLeader = members !== null ? !!myMembership?.leader : !!seedGroup?.leader;
  const canEditResources = isLeader || UserHelper.checkAccess(Permissions.membershipApi.groups.edit);
  const canManageGroup = canEditResources;
  // Mirrors the server gate: group leaders, or staff who actually hold the attendance permission
  const canTakeAttendance = isLeader || UserHelper.checkAccess(Permissions.attendanceApi.attendance.edit);
  const discussionsEnabled = group?.discussionsEnabled !== false;
  const announcementsEnabled = group?.announcementsEnabled !== false;
  const chatEnabled = discussionsEnabled || announcementsEnabled;
  // Non-members only get the details and the join action; the rest of the plate is for members and staff.
  const isOutsider = !isMember && !canManageGroup;

  const { data: resources } = useGroupResources(group && !isOutsider ? groupId || "" : "");

  const showMeetings = isMember || canTakeAttendance;
  const { data: sessions = [] } = useQuery<MeetingSession[]>({
    queryKey: ["group-sessions", groupId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/sessions?groupId=${groupId}`, "AttendanceApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId && showMeetings
  });
  const refreshSessions = () => queryClient.invalidateQueries({ queryKey: ["group-sessions", groupId] });

  const previewType = discussionsEnabled ? "group" : "groupAnnouncement";
  const { data: chatPreview = [] } = useQuery<PreviewMessage[]>({
    queryKey: ["group-chat-preview", groupId, previewType],
    queryFn: async () => {
      const data = await ApiHelper.get(`/conversations/messages/${previewType}/${groupId}?page=1&limit=5`, "MessagingApi");
      const latest: PreviewMessage[] = (Array.isArray(data) ? data : [])
        .flatMap((c: { messages?: PreviewMessage[] }) => c.messages || [])
        .filter((m: PreviewMessage) => m.messageType !== SUBSCRIPTION_MESSAGE_TYPE)
        .sort((a: PreviewMessage, b: PreviewMessage) => new Date(b.timeSent || 0).getTime() - new Date(a.timeSent || 0).getTime())
        .slice(0, 2);
      const ids = Array.from(new Set(latest.map((m) => m.personId).filter(Boolean)));
      let people: PersonInterface[] = [];
      if (ids.length) {
        try { people = await ApiHelper.get(`/people/basic?ids=${ids.join(",")}`, "MembershipApi"); } catch { people = []; }
      }
      return latest.map((m) => ({ ...m, name: (Array.isArray(people) ? people : []).find((p) => p.id === m.personId)?.name?.display || "" }));
    },
    enabled: !!groupId && isMember && chatEnabled
  });

  const handleLeave = async () => {
    setLeaveDialogOpen(false);
    if (!currentPersonId || !members) return;
    const mine = members.find((m) => (m.personId || m.person?.id) === currentPersonId);
    if (!mine?.id) return;
    setJoining(true);
    try {
      await ApiHelper.delete(`/groupmembers/${mine.id}`, "MembershipApi");
      refreshMembers();
    } catch {
      setActionError(Locale.label("mobile.details.groupActionFailed"));
    } finally {
      setJoining(false);
    }
  };

  const handleJoin = async () => {
    if (!currentPersonId || !groupId) return;
    setJoining(true);
    try {
      const result: any = await ApiHelper.post(
        "/groupmembers/self",
        { groupId },
        "MembershipApi"
      );
      if (result?.redirect === "request") {
        setRequestDialogOpen(true);
      } else {
        refreshMembers();
      }
    } catch {
      setActionError(Locale.label("mobile.details.groupActionFailed"));
    } finally {
      setJoining(false);
    }
  };

  const handleRequest = () => setRequestDialogOpen(true);

  const myPendingForGroup = React.useMemo(
    () => myJoinRequests.find((r) => r.groupId === groupId && r.status === "pending"),
    [myJoinRequests, groupId]
  );

  // "Sign in to join" returns here with ?join=1 so the visitor lands in the join step, not on a bare page.
  const autoJoinHandled = React.useRef(false);
  React.useEffect(() => {
    if (autoJoinHandled.current || searchParams?.get("join") !== "1") return;
    if (!group || !currentPersonId || !membersSettled || !requestsSettled) return;
    autoJoinHandled.current = true;
    if (isMember || myPendingForGroup) return;
    const policy = group.joinPolicy ?? "open";
    if (policy === "request") setRequestDialogOpen(true);
    else if (policy === "open") handleJoin();
  }, [group, currentPersonId, membersSettled, requestsSettled, isMember, myPendingForGroup]);

  const openChat = () => {
    setChatInitialTab(discussionsEnabled ? "discussions" : "announcements");
    setView("messages");
  };

  const planTeaser = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dated = groupPlans.filter((p) => p.serviceDate).map((p) => ({ p, d: DateHelper.toDate(p.serviceDate as any) }));
    const upcoming = dated.filter((x) => x.d >= today).sort((a, b) => a.d.getTime() - b.d.getTime());
    const past = dated.filter((x) => x.d < today).sort((a, b) => b.d.getTime() - a.d.getTime());
    return upcoming[0] || past[0] || null;
  }, [groupPlans]);

  const memberName = (m: GroupMember) => m.person?.name?.display || Locale.label("mobile.components.unknown");
  const memberHref = (m: GroupMember) => {
    const pid = m.personId || m.person?.id;
    return pid ? `/mobile/community/${pid}` : undefined;
  };
  const leaderCount = (members || []).filter((m) => m.leader).length;
  const memberSummary = members
    ? [
      plural(members.length, Locale.label("mobile.details.memberSingular"), Locale.label("mobile.details.membersLowercase")),
      leaderCount ? plural(leaderCount, Locale.label("mobile.group.leaderLowercase"), Locale.label("mobile.group.leadersLowercase")) : ""
    ].filter(Boolean).join(" · ")
    : "";

  if (group === undefined) {
    return (
      <Box sx={{ px: { xs: "16px", md: 0 } }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="rounded" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  if (group === null) {
    return (
      <>
        <PageHead title={Locale.label("mobile.details.groupNotFound")} lede={Locale.label("mobile.details.groupNotFoundDescription")} />
        <BackVerb href="/mobile/groups" label={Locale.label("mobile.details.backToGroups")} />
      </>
    );
  }

  const groupName = group.name || Locale.label("mobile.components.group");
  const schedule = [group.meetingDay, group.meetingTime, group.meetingLocation].filter(Boolean).join(" · ");
  const hasAbout = !!group.about;

  const renderJoinAction = () => {
    if (!currentPersonId || isMember) return null;
    const policy = group.joinPolicy ?? "open";
    if (policy === "closed") return null;
    if (policy === "request") {
      if (myPendingForGroup) {
        return (
          <Box data-testid="request-pending-notice">
            <StatusBadge tone="warn" dot>{Locale.label("mobile.details.requestPending")}</StatusBadge>
            <Typography sx={{ mt: "6px", fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>{Locale.label("mobile.details.requestPendingNote")}</Typography>
          </Box>
        );
      }
      return (
        <Button variant="contained" disabled={joining} onClick={handleRequest} data-testid="request-to-join-button">
          {Locale.label("mobile.group.requestToJoin")}
        </Button>
      );
    }
    return (
      <Button variant="contained" disabled={joining} onClick={handleJoin} data-testid="join-group-button">
        {Locale.label("mobile.details.joinGroup")}
      </Button>
    );
  };

  const identity = (
    <>
      {group.photoUrl && <Box sx={{ display: { xs: "none", md: "block" }, mb: "16px" }}><Thumb src={group.photoUrl} alt={groupName} width="100%" height="auto" /></Box>}
      <PageHead
        title={groupName}
        lede={(schedule || isLeader) ? (
          <>
            {schedule && <Box>{schedule}</Box>}
            {isLeader && <PillRow sx={{ mt: "12px" }}><Pill qualifier={`· ${Locale.label("mobile.details.leader")}`}>{Locale.label("mobile.group.you")}</Pill></PillRow>}
          </>
        ) : undefined}
      >
        {isMember && chatEnabled && (
          <Button variant="contained" startIcon={<ChatBubbleOutlineIcon />} onClick={openChat} data-testid="group-open-chat">
            {Locale.label("mobile.group.openChat")}
          </Button>
        )}
        {renderJoinAction()}
      </PageHead>
    </>
  );

  const aboutSection = (
    <PlateSection title={Locale.label("mobile.details.tabAbout")}>
      {hasAbout ? (
        <Box sx={{ fontSize: 15, lineHeight: "22px", color: tc.text, "& p": { mt: 0, mb: 1 }, "& p:last-child": { mb: 0 }, "& a": { color: tc.link }, "& ul, & ol": { pl: 3, mt: 0, mb: 1 } }}>
          <MarkdownPreviewLight value={group.about || ""} />
        </Box>
      ) : <QuietEmpty>{Locale.label("mobile.details.noDetailsYet")}</QuietEmpty>}
    </PlateSection>
  );

  const allLink = (slice: SliceKey, label: string) => (
    <TextLink onClick={() => setView(slice)} data-testid={`group-all-${slice}`}>{label}</TextLink>
  );

  const memberCount = members?.length || 0;
  const openMeeting = (day: string) => {
    if (day > toHtmlDate(new Date())) { setNoteDate(day); return; }
    setAttendanceDate(day);
    setView("attendance");
  };
  const takeAttendance = () => {
    setAttendanceDate(undefined);
    setView("attendance");
  };
  const meetingsAction = canTakeAttendance ? (
    <Box sx={{ display: "flex", gap: "16px" }}>
      <TextLink onClick={() => setNoteDate("")} data-testid="group-add-note">{Locale.label("mobile.group.addNote")}</TextLink>
      <TextLink onClick={takeAttendance} data-testid="group-all-attendance">{Locale.label("mobile.group.takeAttendance")}</TextLink>
    </Box>
  ) : allLink("meetings", Locale.label("mobile.group.allMeetings"));

  const renderMembersTeaser = () => {
    if (membersUnavailable) return <QuietEmpty>{Locale.label("mobile.details.membersPrivate")}</QuietEmpty>;
    if (members === null) return <Skeleton variant="rounded" height={32} width="70%" />;
    if (members.length === 0) return <QuietEmpty>{Locale.label("mobile.details.noMembersYet")}</QuietEmpty>;
    const preview = [...members].sort((a, b) => Number(!!b.leader) - Number(!!a.leader)).slice(0, 6);
    return (
      <>
        <PillRow>
          {preview.map((m) => (
            <Pill key={m.id} href={memberHref(m)} qualifier={m.leader ? `· ${Locale.label("mobile.details.leader")}` : undefined}>{memberName(m)}</Pill>
          ))}
        </PillRow>
        <Typography sx={{ mt: "10px", fontSize: 14, lineHeight: "20px", color: tc.textSecondary }}>{memberSummary}</Typography>
      </>
    );
  };

  const renderResourcesTeaser = () => {
    if (!resources) return <Skeleton variant="rounded" height={48} />;
    const items = [
      ...resources.links.map((l) => ({ key: `l-${l.id}`, href: isHttpUrl(l.url) ? l.url : undefined, icon: <LinkIcon sx={{ color: tc.textSecondary }} />, title: l.text || Locale.label("mobile.group.linkFallback") })),
      ...resources.files.map((f) => ({ key: `f-${f.id}`, href: f.contentPath || undefined, icon: <DescriptionOutlinedIcon sx={{ color: tc.textSecondary }} />, title: f.fileName || Locale.label("mobile.group.fileFallback") }))
    ].slice(0, 3);
    if (items.length === 0) return <QuietEmpty>{Locale.label("mobile.group.noResources")}</QuietEmpty>;
    return <RowList>{items.map(({ key, ...r }) => <ResourceRow key={key} {...r} />)}</RowList>;
  };

  const plate = (
    <Plate>
      {groupId && (
        <PlateSection title={Locale.label("mobile.group.nextEvent")} action={allLink("events", Locale.label("mobile.group.allEvents"))}>
          <GroupNextEvent groupId={groupId} isMember={isMember} />
        </PlateSection>
      )}
      <GroupLessonTakeHome isMember={isMember} plans={groupPlans} />
      {showMeetings && (
        <PlateSection title={Locale.label("mobile.group.meetings")} action={meetingsAction}>
          <GroupMeetingsList sessions={sessions} memberCount={memberCount} limit={3} onOpen={canTakeAttendance ? openMeeting : undefined} />
          {canTakeAttendance && listedMeetings(sessions).length > 3 && (
            <Box sx={{ mt: "10px" }}>{allLink("meetings", Locale.label("mobile.group.allMeetings"))}</Box>
          )}
        </PlateSection>
      )}
      {isMember && chatEnabled && (
        <PlateSection title={Locale.label("mobile.details.tabMessages")} action={<TextLink onClick={openChat}>{Locale.label("mobile.group.openChat")}</TextLink>}>
          {chatPreview.length === 0 ? <QuietEmpty>{Locale.label("mobile.components.noMessages")}</QuietEmpty> : (
            <RowList>
              {chatPreview.map((m, i) => (
                <Row
                  key={m.id || i}
                  onClick={openChat}
                  leading={<PersonAvatar name={m.name} size={32} />}
                  title={m.name || Locale.label("mobile.components.unknown")}
                  subtitle={truncate(m.content || "")}
                  trailing={<Typography sx={{ fontSize: 12.5, color: tc.textSecondary, flex: "none" }}>{timeAgo(m.timeSent)}</Typography>}
                />
              ))}
            </RowList>
          )}
        </PlateSection>
      )}
      <PlateSection title={Locale.label("mobile.details.membersTab")} action={!membersUnavailable && allLink("members", Locale.label("mobile.group.allMembers"))}>
        {renderMembersTeaser()}
      </PlateSection>
      <PlateSection title={Locale.label("mobile.details.tabResources")} action={allLink("resources", Locale.label("mobile.group.allResources"))}>
        {renderResourcesTeaser()}
      </PlateSection>
      {hasPlans && (
        <PlateSection title={Locale.label("groupsPage.plans")} action={allLink("plans", Locale.label("mobile.group.allPlans"))}>
          {planTeaser
            ? <Row href={`/mobile/plans/${planTeaser.p.id}`} title={planTeaser.p.name} subtitle={DateHelper.prettyDate(planTeaser.d)} chevron sx={{ minHeight: 0, py: 0 }} />
            : <QuietEmpty>{Locale.label("groupsPage.noUpcomingPlans")}</QuietEmpty>}
        </PlateSection>
      )}
      {hasAbout && aboutSection}
      {isMember && currentPersonId && (
        <PlateSection>
          <TextLink danger disabled={joining} onClick={() => setLeaveDialogOpen(true)} data-testid="leave-group-button">{Locale.label("mobile.details.leaveGroup")}</TextLink>
        </PlateSection>
      )}
    </Plate>
  );

  const renderMembersSlice = () => {
    if (membersUnavailable) return <PlateSection><QuietEmpty>{Locale.label("mobile.details.membersPrivate")}</QuietEmpty></PlateSection>;
    const q = memberSearch.trim().toLowerCase();
    const list = (members || []).filter((m) => !q || memberName(m).toLowerCase().includes(q));
    return (
      <PlateSection>
        <SearchField value={memberSearch} onChange={setMemberSearch} label={Locale.label("mobile.screens.searchMembers")} />
        {members === null && <Box sx={{ mt: "12px" }}>{[0, 1, 2].map((k) => <Skeleton key={k} variant="rounded" height={48} sx={{ mb: "8px" }} />)}</Box>}
        {members !== null && list.length === 0 && <QuietEmpty sx={{ mt: "12px" }}>{members.length === 0 ? Locale.label("mobile.details.noMembersYet") : Locale.label("mobile.screens.noMembersFound")}</QuietEmpty>}
        {list.length > 0 && (
          <RowList sx={{ mt: "8px" }}>
            {list.map((m) => (
              <Row
                key={m.id}
                href={memberHref(m)}
                leading={<PersonAvatar name={memberName(m)} src={photoOf(m.person)} />}
                title={memberName(m)}
                subtitle={m.leader ? Locale.label("mobile.details.leader") : undefined}
                chevron
              />
            ))}
          </RowList>
        )}
      </PlateSection>
    );
  };

  const slice = !isOutsider ? (view as SliceKey) : "";
  const slices: Partial<Record<SliceKey, { title: string; lede?: string; body: React.ReactNode } | null>> = groupId ? {
    events: {
      title: Locale.label("mobile.details.tabEvents"),
      body: (
        <GroupCalendarTab
          groupId={groupId}
          canManage={canManageGroup}
          isMember={isMember}
          onAddEvent={(dateIso) => setCreateEvent(dateIso)}
          onEditEvent={(ev) => setEditEvent(ev)}
          firstDayOfWeek={getFirstDayOfWeek(config.church)}
        />
      )
    },
    members: { title: Locale.label("mobile.details.membersTab"), lede: memberSummary, body: renderMembersSlice() },
    resources: { title: Locale.label("mobile.details.tabResources"), body: <GroupResourcesTab groupId={groupId} canEdit={canEditResources} /> },
    plans: hasPlans ? { title: Locale.label("groupsPage.plans"), body: <GroupPlansTab groupId={groupId} /> } : null,
    meetings: showMeetings ? {
      title: Locale.label("mobile.group.meetings"),
      body: <PlateSection><GroupMeetingsList sessions={sessions} memberCount={memberCount} onOpen={canTakeAttendance ? openMeeting : undefined} /></PlateSection>
    } : null,
    attendance: canTakeAttendance && members !== null ? {
      title: Locale.label("mobile.details.tabAttendance"),
      body: (
        <GroupAttendanceTab
          key={attendanceDate || "today"}
          groupId={groupId}
          initialDate={attendanceDate}
          onSaved={refreshSessions}
          members={(members || [])
            .filter((m) => m.person?.id)
            .map((m) => ({ id: m.id, person: { id: m.person!.id, name: { display: m.person!.name?.display }, photo: m.person!.photo } }))}
        />
      )
    } : null
  } : {};
  const activeSlice = slice ? slices[slice] : null;
  const chatOpen = view === "messages" && chatEnabled;

  return (
    <>
      {/* The full-screen chat replaces the page; the plate's stale message preview must not linger beneath it. */}
      {chatOpen ? null : activeSlice ? (
        <>
          <BackVerb label={Locale.label("mobile.group.backTo").replace("{}", groupName)} onClick={() => setView("")} />
          <PageHead title={activeSlice.title} lede={activeSlice.lede || undefined} />
          <Plate>{activeSlice.body}</Plate>
        </>
      ) : isOutsider ? (
        <Box data-testid="group-outsider-view">
          <RecordLayout identity={identity}><Plate>{aboutSection}</Plate></RecordLayout>
        </Box>
      ) : (
        <RecordLayout identity={identity}>{plate}</RecordLayout>
      )}

      {groupId && (
        <GroupChatModal
          open={chatOpen}
          groupId={groupId}
          groupName={group.name}
          isLeader={isLeader}
          discussionsEnabled={discussionsEnabled}
          announcementsEnabled={announcementsEnabled}
          initialSubTab={chatInitialTab}
          onClose={() => {
            setView("");
            queryClient.invalidateQueries({ queryKey: ["group-chat-preview", groupId] });
          }}
        />
      )}
      {groupId && (
        <CreateEventModal
          open={!!createEvent}
          groupId={groupId}
          initialDateIso={createEvent || undefined}
          onClose={() => setCreateEvent(null)}
          onSaved={() => {
            setCreateEvent(null);
            queryClient.invalidateQueries({ queryKey: ["group-events", groupId] });
          }}
        />
      )}
      {groupId && (
        <CreateEventModal
          open={!!editEvent}
          groupId={groupId}
          event={editEvent as any}
          onClose={() => setEditEvent(null)}
          onSaved={() => {
            setEditEvent(null);
            queryClient.invalidateQueries({ queryKey: ["group-events", groupId] });
          }}
        />
      )}
      {groupId && canTakeAttendance && (
        <MeetingNoteSheet
          open={noteDate !== null}
          groupId={groupId}
          sessions={sessions}
          initialDate={noteDate || undefined}
          onClose={() => setNoteDate(null)}
          onSaved={() => {
            setNoteDate(null);
            refreshSessions();
          }}
        />
      )}
      <Sheet
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        title={Locale.label("mobile.details.leaveGroupTitle")}
        maxWidth="xs"
        actions={(
          <>
            <Button variant="outlined" onClick={() => setLeaveDialogOpen(false)}>{Locale.label("common.cancel")}</Button>
            <Button variant="contained" color="error" onClick={handleLeave} data-testid="confirm-leave-group">{Locale.label("mobile.details.leaveGroup")}</Button>
          </>
        )}
      >
        <Typography sx={{ color: tc.textSecondary }}>{Locale.label("mobile.details.leaveGroupBody")}</Typography>
      </Sheet>
      <Snackbar open={!!actionError} autoHideDuration={4000} onClose={() => setActionError(null)} message={actionError} />
      {groupId && (
        <RequestToJoinDialog
          open={requestDialogOpen}
          groupId={groupId}
          groupName={group.name}
          onClose={() => setRequestDialogOpen(false)}
          onSubmitted={() => {
            setRequestDialogOpen(false);
            refetchMyRequests();
          }}
        />
      )}
    </>
  );
};

export default GroupDetail;
