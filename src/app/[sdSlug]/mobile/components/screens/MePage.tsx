"use client";

import React, { useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box, Chip, Icon, Skeleton, Typography } from "@mui/material";
import { ApiHelper, ArrayHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { AssignmentInterface, PlanInterface, PositionInterface, RegistrationInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { EventProcessor } from "../../helpers/eventProcessor";
import { formatRelative, deriveNotificationUrl, getNotificationIcon } from "../util";
import type { EventRow } from "../group/GroupCalendarTab";

interface Props {
  config: ConfigurationInterface;
}

type ItemKind = "serving" | "event" | "registration";

interface UpcomingItem {
  kind: ItemKind;
  date: Date;
  title: string;
  subtitle?: string;
  href: string;
  key: string;
}

interface NotificationItem {
  id?: string;
  message?: string;
  timeSent?: string | Date;
  contentType?: string;
  contentId?: string;
}

const kindMeta: Record<ItemKind, { icon: string; label: string }> = {
  serving: { icon: "assignment_ind", label: "mobile.me.serving" },
  event: { icon: "event", label: "mobile.me.event" },
  registration: { icon: "how_to_reg", label: "mobile.me.registration" }
};

export const MePage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const personId = context?.person?.id || context?.userChurch?.person?.id;

  const { data: assignments = [] } = useQuery<AssignmentInterface[]>({
    queryKey: ["/assignments/my", "DoingApi", context?.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/assignments/my", "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
    staleTime: 5 * 60 * 1000
  });

  const positionIds = useMemo(() => [...ArrayHelper.getUniqueValues(assignments, "positionId")].sort(), [assignments]);
  const positionIdsKey = positionIds.join(",");

  const { data: positions = [] } = useQuery<PositionInterface[]>({
    queryKey: ["/positions/ids", "DoingApi", positionIdsKey],
    queryFn: async () => {
      const data = await ApiHelper.get("/positions/ids?ids=" + positionIdsKey, "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn && positionIds.length > 0,
    staleTime: 10 * 60 * 1000
  });

  const planIds = useMemo(() => [...ArrayHelper.getUniqueValues(positions, "planId")].sort(), [positions]);
  const planIdsKey = planIds.join(",");

  const { data: plans = [] } = useQuery<PlanInterface[]>({
    queryKey: ["/plans/ids", "DoingApi", planIdsKey],
    queryFn: async () => {
      const data = await ApiHelper.get("/plans/ids?ids=" + planIdsKey, "DoingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn && planIds.length > 0,
    staleTime: 10 * 60 * 1000
  });

  const { data: registrations = [] } = useQuery<RegistrationInterface[]>({
    queryKey: ["/registrations/person", personId],
    queryFn: async () => {
      const data = await ApiHelper.get("/registrations/person/" + personId, "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn && !!personId,
    staleTime: 60 * 1000
  });

  const { data: timeline = [] } = useQuery<EventRow[]>({
    queryKey: ["/events/timeline"],
    queryFn: async () => {
      const data = await ApiHelper.get("/events/timeline", "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
    staleTime: 60 * 1000
  });

  const { data: bookingCatalog = { rooms: [], resources: [] } } = useQuery<{ rooms: any[]; resources: any[] }>({
    queryKey: ["me-booking-catalog"],
    queryFn: async () => {
      const [rooms, resources] = await Promise.all([
        ApiHelper.get("/rooms", "ContentApi").catch((): any[] => []),
        ApiHelper.get("/resources", "ContentApi").catch((): any[] => [])
      ]);
      return { rooms: Array.isArray(rooms) ? rooms : [], resources: Array.isArray(resources) ? resources : [] };
    },
    enabled: loggedIn,
    staleTime: 5 * 60 * 1000
  });
  const hasBookingCatalog = (bookingCatalog.rooms.length + bookingCatalog.resources.length) > 0;

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", context?.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/notifications/my", "MessagingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
    staleTime: 60 * 1000
  });

  const upcoming = useMemo<UpcomingItem[]>(() => {
    const now = new Date();
    const items: UpcomingItem[] = [];

    assignments.forEach((a) => {
      const position = positions.find((p) => p.id === a.positionId);
      if (!position) return;
      const plan = plans.find((p) => p.id === position.planId);
      if (!plan?.serviceDate) return;
      const date = DateHelper.toDate(plan.serviceDate);
      if (date < now) return;
      items.push({ kind: "serving", date, title: plan.name || Locale.label("mobile.me.serving"), subtitle: position.name, href: `/mobile/plans/${plan.id}`, key: `serv-${a.id}` });
    });

    registrations.forEach((r) => {
      const start = (r as any).event?.start;
      if (!start) return;
      const date = new Date(start);
      if (isNaN(date.getTime()) || date < now || r.status === "cancelled") return;
      items.push({ kind: "registration", date, title: (r as any).event?.title || Locale.label("mobile.me.registration"), href: "/mobile/registrations", key: `reg-${r.id}` });
    });

    // Expand recurring group events across the next few months, keep future occurrences.
    const normalized = EventProcessor.updateTime(timeline as any);
    const months = [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 1), new Date(now.getFullYear(), now.getMonth() + 2, 1)];
    const seen = new Set<string>();
    months.forEach((month) => {
      EventProcessor.expandEventsForMonth(normalized, month).forEach((e: any) => {
        const date = e.start instanceof Date ? e.start : new Date(e.start);
        if (isNaN(date.getTime()) || date < now) return;
        const key = `evt-${e.id}-${date.getTime()}`;
        if (seen.has(key)) return;
        seen.add(key);
        items.push({ kind: "event", date, title: e.title || Locale.label("mobile.me.event"), href: e.groupId ? `/mobile/groups/${e.groupId}?activeTab=events` : "/mobile/groups", key });
      });
    });

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    return items.slice(0, 12);
  }, [assignments, positions, plans, registrations, timeline]);

  const recentNotifications = useMemo(() => (notifications || []).slice(0, 5), [notifications]);

  const stillLoading = loggedIn && assignments.length === 0 && registrations.length === 0 && timeline.length === 0;

  const renderItem = (item: UpcomingItem) => {
    const meta = kindMeta[item.kind];
    return (
      <Box
        key={item.key}
        role="button"
        tabIndex={0}
        onClick={() => router.push(item.href)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(item.href); } }}
        data-testid={`me-item-${item.kind}`}
        sx={{ display: "flex", alignItems: "center", gap: "12px", bgcolor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: "12px", p: "14px", cursor: "pointer" }}
      >
        <Box sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: "12px", bgcolor: tc.iconBackground, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon sx={{ color: tc.primary }}>{meta.icon}</Icon>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</Typography>
          <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>
            {DateHelper.prettyDateTime(item.date)}{item.subtitle ? ` · ${item.subtitle}` : ""}
          </Typography>
        </Box>
        <Chip size="small" label={Locale.label(meta.label)} sx={{ bgcolor: tc.primaryLight, color: tc.primary, fontWeight: 700, fontSize: 10.5, borderRadius: "999px" }} />
      </Box>
    );
  };

  const renderShortcut = (icon: string, label: string, href: string) => (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(href); } }}
      sx={{ display: "flex", alignItems: "center", gap: "12px", bgcolor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: "12px", p: "12px 16px", cursor: "pointer" }}
    >
      <Icon sx={{ color: tc.primary }}>{icon}</Icon>
      <Typography sx={{ flex: 1, fontSize: 14, fontWeight: 600, color: tc.text }}>{label}</Typography>
      <Icon sx={{ color: tc.disabled, fontSize: 20 }}>chevron_right</Icon>
    </Box>
  );

  const sectionHeader = (label: string) => (
    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: tc.textSecondary, textTransform: "uppercase", letterSpacing: "0.12em", mt: 1 }}>{label}</Typography>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {hasBookingCatalog && (
          <>
            {sectionHeader(Locale.label("mobile.me.shortcuts"))}
            {renderShortcut("event_note", Locale.label("mobile.me.myRequests"), "/mobile/myRequests")}
            {renderShortcut("add_circle", Locale.label("mobile.me.requestEvent"), "/mobile/requestEvent")}
          </>
        )}

        {sectionHeader(Locale.label("mobile.me.upcoming"))}
        {stillLoading && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: "12px" }} />)}
        {!stillLoading && upcoming.length === 0 && (
          <Box sx={{ bgcolor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: `${mobileTheme.radius.xl}px`, p: `${mobileTheme.spacing.lg}px`, textAlign: "center" }}>
            <Icon sx={{ fontSize: 48, color: tc.disabled }}>event_available</Icon>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text, mt: 1 }}>{Locale.label("mobile.me.nothingUpcoming")}</Typography>
            <Typography sx={{ fontSize: 14, color: tc.textMuted, mt: 0.5 }}>{Locale.label("mobile.me.nothingUpcomingBody")}</Typography>
          </Box>
        )}
        {!stillLoading && upcoming.map(renderItem)}

        {recentNotifications.length > 0 && (
          <>
            {sectionHeader(Locale.label("mobile.me.recentNotifications"))}
            {recentNotifications.map((n, idx) => {
              const href = deriveNotificationUrl(n);
              return (
                <Box
                  key={n.id || `n-${idx}`}
                  role={href ? "button" : undefined}
                  tabIndex={href ? 0 : undefined}
                  onClick={() => { if (href) router.push(href); }}
                  sx={{ display: "flex", alignItems: "flex-start", gap: "12px", bgcolor: tc.surface, border: `1px solid ${tc.border}`, borderRadius: "12px", p: "14px", cursor: href ? "pointer" : "default" }}
                >
                  <Box sx={{ width: 36, height: 36, flexShrink: 0, borderRadius: "11px", bgcolor: tc.iconBackground, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon sx={{ color: tc.primary, fontSize: 20 }}>{getNotificationIcon(n.contentType)}</Icon>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, color: tc.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.message}</Typography>
                    <Typography sx={{ fontSize: 12, color: tc.disabled, mt: 0.5 }}>{formatRelative(n.timeSent)}</Typography>
                  </Box>
                </Box>
              );
            })}
          </>
        )}
      </Box>
    </Box>
  );
};

export default MePage;
