"use client";

import React, { useContext, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { GroupInterface, TaskInterface } from "@churchapps/helpers";
import { ApiHelper, CurrencyHelper, DateHelper, Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import type { PostInterface } from "@/helpers/interfaces";
import { mobileTheme } from "./mobileTheme";
import { ConfirmDeclineSheet } from "./ConfirmDeclineSheet";
import { EventProcessor } from "../helpers/eventProcessor";
import { attendanceSubtitle, attendanceTitle, useMyRegistrations, type MyAttendanceRecord, type MyFormSubmission } from "../helpers/myRecords";
import { MyTaskSheet, TaskRow } from "./screens/CardSheet";
import { BigNumber, PersonAvatar, PlateSection, Row, RowList, StatusBadge, TextLink, type BadgeTone } from "./kit";

interface UpcomingAssignment {
  assignmentId: string;
  status?: string;
  positionName?: string;
  planId: string;
  planName?: string;
  serviceDate: string | Date;
}

export interface UpcomingEvent { key: string; eventId?: string; date: Date; title: string; href: string; photoUrl?: string }

export type UpcomingKind = "serving" | "event" | "registration";
export type HomeUpcomingEvent = UpcomingEvent & { kind: "event" | "registration" };

// Status tag for each upcoming row, shared by Me and Home.
export const upcomingKindMeta: Record<UpcomingKind, { tone: BadgeTone; label: string }> = {
  serving: { tone: "warn", label: "mobile.me.serving" },
  event: { tone: "pri", label: "mobile.me.event" },
  registration: { tone: "ok", label: "mobile.me.registration" }
};

interface GivingSummary { year: number; total: number; count: number; currency: string; isConverted?: boolean }

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const isStatus = (a: UpcomingAssignment, s: string) => (a.status || "").toLowerCase() === s;

export const useUpcomingServing = (enabled: boolean) => {
  const userId = useContext(UserContext)?.user?.id;
  const queryKey = ["/assignments/my/upcoming", "DoingApi", userId];
  const query = useQuery<UpcomingAssignment[]>({
    queryKey,
    queryFn: async () => {
      const data = await ApiHelper.get("/assignments/my/upcoming", "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled,
    staleTime: 5 * 60 * 1000
  });
  const today = startOfToday();
  const upcoming = (query.data || []).filter((a) => !isStatus(a, "declined") && DateHelper.toDate(a.serviceDate) >= today);
  return { upcoming, queryKey };
};

export const useMyGroups = (enabled: boolean) => {
  const userId = useContext(UserContext)?.user?.id;
  // Same key and shape as GroupsPage, so both screens share one cache entry.
  const { data = [] } = useQuery<GroupInterface[]>({
    queryKey: ["my-groups", userId],
    queryFn: async () => {
      const data = await ApiHelper.get("/groups/my", "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });
  return data;
};

// Expands recurring timeline events across this month and the next two, keeping future occurrences in date order.
export const expandUpcomingEvents = (timeline: any[], now: Date = new Date()): UpcomingEvent[] => {
  const normalized = EventProcessor.updateTime(timeline as any);
  const months = [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 1), new Date(now.getFullYear(), now.getMonth() + 2, 1)];
  const seen = new Set<string>();
  const items: UpcomingEvent[] = [];
  months.forEach((month) => {
    EventProcessor.expandEventsForMonth(normalized, month).forEach((e: any) => {
      const date = e.start instanceof Date ? e.start : new Date(e.start);
      if (isNaN(date.getTime()) || date < now) return;
      const key = `evt-${e.id}-${date.getTime()}`;
      if (seen.has(key)) return;
      seen.add(key);
      items.push({ key, eventId: e.id, date, title: e.title || Locale.label("mobile.me.event"), href: e.groupId ? `/mobile/groups/${e.groupId}?activeTab=events` : "/mobile/groups", photoUrl: e.photoUrl || undefined });
    });
  });
  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
};

export const useUpcomingEvents = (enabled: boolean) => {
  // Same key as MePage, so both screens share one cache entry.
  const { data } = useQuery<any[]>({
    queryKey: ["/events/timeline"],
    queryFn: async () => {
      const data = await ApiHelper.get("/events/timeline", "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled,
    staleTime: 60 * 1000
  });
  const context = useContext(UserContext);
  const personId = context?.person?.id || context?.userChurch?.person?.id;
  const { data: registrations } = useMyRegistrations(personId, enabled);
  return useMemo<HomeUpcomingEvent[]>(() => {
    if (!enabled) return [];
    const now = new Date();
    const items: HomeUpcomingEvent[] = [];
    const registered = new Set<string>();
    (registrations || []).forEach((r: any) => {
      const date = r.event?.start ? new Date(r.event.start) : null;
      if (!date || isNaN(date.getTime()) || date < now || r.status === "cancelled") return;
      registered.add(`${r.eventId}-${date.getTime()}`);
      items.push({ kind: "registration", key: `reg-${r.id}`, eventId: r.eventId, date, title: r.event?.title || Locale.label("mobile.me.registration"), href: "/mobile/registrations", photoUrl: r.event?.photoUrl || undefined });
    });
    // A registered occurrence shows once, as the registration.
    expandUpcomingEvents(data || [], now).forEach((e) => {
      if (!registered.has(`${e.eventId}-${e.date.getTime()}`)) items.push({ kind: "event", ...e });
    });
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [enabled, data, registrations]);
};

// The church's latest published blog posts (optionally one category), read anonymously so signed-out visitors see them too.
export const useLatestPosts = (churchId: string | undefined, pageSize: number, category: string | undefined, enabled: boolean) => {
  const { data = [], isLoading } = useQuery<PostInterface[]>({
    queryKey: ["news-posts", churchId, pageSize, category || ""],
    queryFn: async () => {
      const qs = new URLSearchParams({ pageSize: `${pageSize}` });
      if (category) qs.set("category", category);
      const data = await ApiHelper.getAnonymous(`/posts/public/${churchId}?${qs.toString()}`, "ContentApi");
      return Array.isArray(data) ? data.filter((p: PostInterface) => p?.id && p.slug && p.title) : [];
    },
    enabled: enabled && !!churchId,
    staleTime: 5 * 60 * 1000
  });
  return { posts: data, isLoading: enabled && isLoading };
};

export const useGivingSummary = (enabled: boolean) => {
  const personId = useContext(UserContext)?.person?.id;
  const year = new Date().getFullYear();
  const { data } = useQuery<GivingSummary>({
    queryKey: ["donations-summary", personId, year],
    queryFn: () => ApiHelper.get(`/donations/my/summary?year=${year}`, "GivingApi"),
    enabled: enabled && !!personId
  });
  return data;
};

export const ServingTeaser = ({ upcoming, queryKey }: ReturnType<typeof useUpcomingServing>) => {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [declineTarget, setDeclineTarget] = useState<UpcomingAssignment | null>(null);
  const needsReply = upcoming.filter((a) => isStatus(a, "unconfirmed"));
  const rows = (needsReply.length ? needsReply : upcoming).slice(0, 2);

  const respond = async (a: UpcomingAssignment, action: "accept" | "decline") => {
    setBusyId(a.assignmentId);
    setError("");
    try {
      await ApiHelper.post(`/assignments/${action}/${a.assignmentId}`, [], "DoingApi");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ["/assignments/my"] })
      ]);
    } catch (err: any) {
      setError(err?.message || Locale.label("mobile.details.unableToRespond").replace("{}", action));
    } finally {
      setBusyId("");
    }
  };

  return (
    <PlateSection title={Locale.label("mobile.dashboard.youreServing")} action={<TextLink href="/mobile/plans">{Locale.label("mobile.dashboard.allPlans")}</TextLink>}>
      <RowList>
        {rows.map((a) => {
          const unconfirmed = isStatus(a, "unconfirmed");
          return (
            <Box key={a.assignmentId} data-testid="home-serving-row">
              <Row
                href={`/mobile/plans/${a.planId}`}
                title={DateHelper.prettyDate(DateHelper.toDate(a.serviceDate))}
                subtitle={[a.planName, a.positionName].filter(Boolean).join(" · ")}
                trailing={unconfirmed
                  ? <StatusBadge tone="warn">{Locale.label("mobile.serving.needsReplyBadge")}</StatusBadge>
                  : <StatusBadge tone="ok" dot>{Locale.label(isStatus(a, "accepted") ? "mobile.details.accepted" : "mobile.details.confirmed")}</StatusBadge>}
              />
              {unconfirmed && (
                <Box sx={{ display: "flex", gap: "8px", pb: "8px" }}>
                  <Button size="small" variant="contained" disabled={!!busyId} onClick={() => respond(a, "accept")}>{Locale.label("mobile.details.accept")}</Button>
                  <Button size="small" variant="outlined" disabled={!!busyId} onClick={() => setDeclineTarget(a)}>{Locale.label("mobile.details.decline")}</Button>
                </Box>
              )}
            </Box>
          );
        })}
      </RowList>
      {error && <Typography sx={{ color: mobileTheme.colors.error, fontSize: 14, mt: "6px" }}>{error}</Typography>}
      <ConfirmDeclineSheet open={!!declineTarget} onClose={() => setDeclineTarget(null)} onConfirm={() => { if (declineTarget) respond(declineTarget, "decline"); }} />
    </PlateSection>
  );
};

export const GroupsTeaser = ({ groups }: { groups: GroupInterface[] }) => (
  <PlateSection title={Locale.label("mobile.dashboard.yourGroups")} action={<TextLink href="/mobile/groups">{Locale.label("mobile.dashboard.allGroups")}</TextLink>}>
    <RowList>
      {groups.slice(0, 3).map((g) => (
        <Row
          key={g.id}
          href={`/mobile/groups/${g.id}`}
          leading={<PersonAvatar name={g.name} src={g.photoUrl || undefined} />}
          title={g.name}
          subtitle={[g.meetingTime?.trim(), g.meetingLocation?.trim()].filter(Boolean).join(" · ") || undefined}
        />
      ))}
    </RowList>
  </PlateSection>
);

export const EventsTeaser = ({ events }: { events: HomeUpcomingEvent[] }) => (
  <PlateSection id="dashboard-events" title={Locale.label("mobile.dashboard.upcomingEvents")} action={<TextLink href="/mobile/me?view=upcoming">{Locale.label("mobile.dashboard.allUpcomingEvents")}</TextLink>}>
    <RowList>
      {events.slice(0, 3).map((e) => (
        <Row
          key={e.key}
          href={e.href}
          data-testid="dashboard-event-row"
          leading={e.photoUrl ? <Box component="img" src={e.photoUrl} alt="" loading="lazy" data-testid="dashboard-event-photo" sx={{ width: 64, height: 36, objectFit: "cover", borderRadius: "6px", flexShrink: 0, display: "block" }} /> : undefined}
          title={e.title}
          subtitle={DateHelper.prettyDateTime(e.date)}
          trailing={<StatusBadge tone={upcomingKindMeta[e.kind].tone} data-testid="dashboard-event-badge">{Locale.label(upcomingKindMeta[e.kind].label)}</StatusBadge>}
        />
      ))}
    </RowList>
  </PlateSection>
);

// Same sections as the Me tab, shown on Home when the church turns them on (B1Admin > B1 Mobile).
export const AttendanceTeaser = ({ attendance, groups }: { attendance: MyAttendanceRecord[]; groups: GroupInterface[] }) => {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const attendedLast90 = attendance.filter((r) => r.visitDate && new Date(r.visitDate).getTime() >= cutoff).length;
  return (
    <PlateSection data-testid="home-attendance-section" title={Locale.label("mobile.me.myAttendance")} action={<TextLink href="/mobile/myAttendance">{Locale.label("mobile.screens.tabHistory")}</TextLink>}>
      <Typography sx={{ fontSize: 15, color: mobileTheme.colors.text }}>
        {Locale.label(attendedLast90 === 1 ? "mobile.me.attendedLast90One" : "mobile.me.attendedLast90").replace("{}", String(attendedLast90))}
      </Typography>
      <RowList>
        {attendance.slice(0, 2).map((r, idx) => (
          <Row key={idx} href="/mobile/myAttendance" data-testid="home-attendance-row" title={attendanceTitle(r, groups)} subtitle={attendanceSubtitle(r, groups)} />
        ))}
      </RowList>
    </PlateSection>
  );
};

export const FormsTeaser = ({ submissions }: { submissions: MyFormSubmission[] }) => (
  <PlateSection data-testid="home-forms-section" title={Locale.label("mobile.me.myForms")} action={<TextLink href="/mobile/myForms">{Locale.label("mobile.me.allForms")}</TextLink>}>
    <RowList>
      {submissions.slice(0, 2).map((s) => (
        <Row key={s.id} href="/mobile/myForms" data-testid="home-form-row" title={s.form?.name || Locale.label("mobile.me.form")} subtitle={s.submissionDate ? DateHelper.prettyDate(new Date(s.submissionDate)) : undefined} />
      ))}
    </RowList>
  </PlateSection>
);

// Cards first, then plain tasks; the hooks already sort each newest first.
export const TasksTeaser = ({ cards, tasks }: { cards: TaskInterface[]; tasks: TaskInterface[] }) => {
  const [open, setOpen] = useState<TaskInterface | null>(null);
  const rows = [...cards, ...tasks].slice(0, 2);
  return (
    <PlateSection data-testid="home-tasks-section" title={Locale.label("mobile.dashboard.yourFollowUps")} action={<TextLink href="/mobile/myTasks">{Locale.label("mobile.dashboard.all")}</TextLink>}>
      <RowList>{rows.map((t) => <TaskRow key={t.id} task={t} onOpen={setOpen} />)}</RowList>
      <MyTaskSheet task={open} onClose={() => setOpen(null)} />
    </PlateSection>
  );
};

export const GivingTeaser = ({ summary, canGive = true }: { summary?: GivingSummary; canGive?: boolean }) => (
  <PlateSection title={Locale.label("mobile.dashboard.giving")} action={<TextLink href="/mobile/donate?view=history">{Locale.label("mobile.dashboard.history")}</TextLink>}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
      <Box data-testid="home-giving-total">
        <BigNumber caption={Locale.label("mobile.dashboard.givenIn").replace("{}", String(summary?.year || new Date().getFullYear()))}>
          {summary ? CurrencyHelper.formatCurrencyWithLocale(summary.total || 0, summary.currency) : " "}
        </BigNumber>
      </Box>
      {canGive && <Button variant="contained" component={Link} href="/mobile/donate?view=give">{Locale.label("mobile.giving.give")}</Button>}
    </Box>
  </PlateSection>
);
