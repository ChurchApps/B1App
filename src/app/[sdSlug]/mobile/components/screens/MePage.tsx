"use client";

import React, { useContext, useMemo } from "react";
import Link from "next/link";
import { Avatar, Box, Button, Skeleton, Typography } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { ApiHelper, ArrayHelper, CurrencyHelper, DateHelper, Locale, PersonHelper } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { AssignmentInterface, DonationInterface, GroupInterface, PersonInterface, PlanInterface, PositionInterface, RegistrationInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { EventProcessor } from "../../helpers/eventProcessor";
import { formatRelative, deriveNotificationUrl, getInitials } from "../util";
import type { EventRow } from "../group/GroupCalendarTab";
import { BackVerb, BigNumber, PageHead, Pill, PillRow, Plate, PlateSection, QuietEmpty, RecordLayout, Row, RowList, StatusBadge, TextLink, useSliceView, type BadgeTone } from "../kit";

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
  triggeredByPersonId?: string;
}

interface HouseholdMember extends PersonInterface {
  householdRole?: string;
}

const kindMeta: Record<ItemKind, { tone: BadgeTone; label: string }> = {
  serving: { tone: "warn", label: "mobile.me.serving" },
  event: { tone: "pri", label: "mobile.me.event" },
  registration: { tone: "ok", label: "mobile.me.registration" }
};

const TEASER_COUNT = 3;

export const MePage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const [view, setView] = useSliceView();
  const loggedIn = !!context?.user?.firstName;
  const personId = context?.person?.id || context?.userChurch?.person?.id;
  const givingEnabled = config?.allowDonations !== false && !!personId;

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<AssignmentInterface[]>({
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

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<RegistrationInterface[]>({
    queryKey: ["/registrations/person", personId],
    queryFn: async () => {
      const data = await ApiHelper.get("/registrations/person/" + personId, "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn && !!personId,
    staleTime: 60 * 1000
  });

  const { data: timeline = [], isLoading: timelineLoading } = useQuery<EventRow[]>({
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

  // Same keys and fetchers as ProfileEditPage / GroupsPage / DonatePage so the caches are shared.
  const { data: serverPerson } = useQuery<PersonInterface>({
    queryKey: ["person", personId],
    queryFn: () => ApiHelper.get("/people/" + personId, "MembershipApi"),
    enabled: loggedIn && !!personId
  });
  const householdId = serverPerson?.householdId;

  const { data: household = [] } = useQuery<HouseholdMember[]>({
    queryKey: ["household", householdId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/people/household/${householdId}`, "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn && !!householdId
  });

  const { data: groups = [] } = useQuery<GroupInterface[]>({
    queryKey: ["my-groups", context?.user?.id],
    queryFn: async () => {
      const data = await ApiHelper.get("/groups/my", "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const { data: donations = [] } = useQuery<DonationInterface[]>({
    queryKey: ["donations", personId],
    queryFn: async () => {
      const data = await ApiHelper.get("/donations/my", "GivingApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: loggedIn && givingEnabled
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
      if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return;
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

  const recentNotifications = useMemo(() => (notifications || []).slice(0, 2), [notifications]);

  const givingThisYear = useMemo(() => {
    const year = new Date().getFullYear();
    const gifts = donations.filter((d) => d.donationDate && DateHelper.toDate(d.donationDate).getFullYear() === year);
    const currencies = new Set(gifts.map((d) => ((d as any).currency || "usd").toLowerCase()));
    // Mixed currencies can't be summed without the exchange table, so only the count is shown then.
    const total = currencies.size === 1 ? gifts.reduce((sum, d) => sum + Number((d as any).fund?.amount ?? d.amount ?? 0), 0) : null;
    return { year, count: gifts.length, total, currency: [...currencies][0] || "usd" };
  }, [donations]);

  const otherHousehold = household.filter((h) => h.id !== personId);
  const activeRegistrations = registrations.filter((r) => r.status !== "cancelled").length;
  const stillLoading = assignmentsLoading || registrationsLoading || timelineLoading;

  if (!loggedIn) {
    const returnUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
    return (
      <PageHead title={Locale.label("mobile.me.signInTitle")} lede={Locale.label("mobile.me.signInBody")}>
        <Button variant="contained" href={returnUrl ? `/mobile/login?returnUrl=${returnUrl}` : "/mobile/login"}>
          {Locale.label("mobile.components.signIn")}
        </Button>
      </PageHead>
    );
  }

  const renderItem = (item: UpcomingItem) => (
    <Row
      key={item.key}
      href={item.href}
      data-testid={`me-item-${item.kind}`}
      title={item.title}
      subtitle={`${DateHelper.prettyDateTime(item.date)}${item.subtitle ? ` · ${item.subtitle}` : ""}`}
      trailing={<StatusBadge tone={kindMeta[item.kind].tone}>{Locale.label(kindMeta[item.kind].label)}</StatusBadge>}
    />
  );

  const upcomingList = (items: UpcomingItem[]) => {
    if (stillLoading) return [0, 1, 2].map((i) => <Skeleton key={i} variant="text" height={44} />);
    if (items.length === 0) return <QuietEmpty>{Locale.label("mobile.me.nothingUpcoming")}</QuietEmpty>;
    return <RowList>{items.map(renderItem)}</RowList>;
  };

  if (view === "upcoming") {
    return (
      <Box sx={{ pb: "24px" }}>
        <BackVerb label={Locale.label("mobile.me.backToMe")} onClick={() => setView("")} />
        <Plate>
          <PlateSection title={Locale.label("mobile.me.upcoming")}>{upcomingList(upcoming)}</PlateSection>
        </Plate>
      </Box>
    );
  }

  const name = context?.person?.name?.display || [context?.user?.firstName, context?.user?.lastName].filter(Boolean).join(" ");
  const photoUrl = context?.person?.photo ? PersonHelper.getPhotoUrl(context.person) : undefined;
  const membership = serverPerson?.membershipStatus || context?.person?.membershipStatus;

  const identity = (
    <Box sx={{ px: { xs: "16px", md: 0 } }}>
      <Avatar src={photoUrl} alt={name} sx={{ width: 72, height: 72, bgcolor: tc.chip, color: tc.onChip, fontSize: 26, fontWeight: 600 }}>
        {getInitials({ name: { first: context?.user?.firstName, last: context?.user?.lastName } })}
      </Avatar>
      <PageHead title={name} lede={membership || undefined} sx={{ px: 0, pt: "14px" }}>
        <Button variant="contained" component={Link} href="/mobile/profileEdit" data-testid="me-shortcut-profileEdit">
          {Locale.label("mobile.components.editProfile")}
        </Button>
        <Button variant="outlined" component={Link} href="/mobile/notificationPrefs" startIcon={<SettingsOutlinedIcon />} data-testid="me-shortcut-notificationPrefs">
          {Locale.label("mobile.me.settings")}
        </Button>
      </PageHead>
    </Box>
  );

  return (
    <Box sx={{ pb: "24px" }}>
      <RecordLayout identity={identity}>
        <Plate>
          <PlateSection title={Locale.label("mobile.me.upcoming")} action={upcoming.length > TEASER_COUNT ? <TextLink data-testid="me-upcoming-all" onClick={() => setView("upcoming")}>{Locale.label("mobile.me.allUpcoming")}</TextLink> : undefined}>
            {upcomingList(upcoming.slice(0, TEASER_COUNT))}
          </PlateSection>

          {otherHousehold.length > 0 && (
            <PlateSection title={Locale.label("mobile.screens.tabHousehold")} action={<TextLink href="/mobile/profileEdit">{Locale.label("mobile.screens.tabManage")}</TextLink>}>
              <PillRow>
                {otherHousehold.map((h) => (
                  <Pill key={h.id} href={`/mobile/community/${h.id}`} qualifier={h.householdRole ? `· ${h.householdRole}` : undefined}>
                    {h.name?.display || Locale.label("mobile.components.unknown")}
                  </Pill>
                ))}
              </PillRow>
            </PlateSection>
          )}

          <PlateSection title={Locale.label("mobile.screenTitles.myGroups")} action={<TextLink href="/mobile/groups">{Locale.label("mobile.me.allGroups")}</TextLink>}>
            {groups.length === 0
              ? <QuietEmpty>{Locale.label("mobile.me.noGroups")}</QuietEmpty>
              : (
                <PillRow>
                  {groups.slice(0, 8).map((g) => <Pill key={g.id} href={`/mobile/groups/${g.id}`}>{g.name}</Pill>)}
                </PillRow>
              )}
          </PlateSection>

          {givingEnabled && (
            <PlateSection title={Locale.label("mobile.screenTitles.donation")} action={<TextLink href="/mobile/donate" data-testid="me-shortcut-donate">{Locale.label("mobile.screens.tabHistory")}</TextLink>}>
              {givingThisYear.count === 0
                ? <QuietEmpty>{Locale.label("mobile.me.noGiftsThisYear").replace("{}", String(givingThisYear.year))}</QuietEmpty>
                : (
                  <BigNumber caption={Locale.label("mobile.me.givenThisYear").replace("{0}", String(givingThisYear.year)).replace("{1}", String(givingThisYear.count))}>
                    {givingThisYear.total !== null ? CurrencyHelper.formatCurrencyWithLocale(givingThisYear.total, givingThisYear.currency) : givingThisYear.count}
                  </BigNumber>
                )}
            </PlateSection>
          )}

          <PlateSection title={Locale.label("mobile.me.requestsAndRegistrations")}>
            <Typography sx={{ fontSize: 15, color: tc.text }}>
              {Locale.label("mobile.me.registrationCount").replace("{}", String(activeRegistrations))}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", mt: "8px" }}>
              <TextLink href="/mobile/registrations" data-testid="me-shortcut-registrations">{Locale.label("mobile.screenTitles.registrations")}</TextLink>
              {hasBookingCatalog && <TextLink href="/mobile/myRequests" data-testid="me-shortcut-myRequests">{Locale.label("mobile.me.myRequests")}</TextLink>}
              {hasBookingCatalog && <TextLink href="/mobile/requestEvent" data-testid="me-shortcut-requestEvent">{Locale.label("mobile.me.requestEvent")}</TextLink>}
            </Box>
          </PlateSection>

          <PlateSection title={Locale.label("mobile.inbox.title")} action={<TextLink href="/mobile/notifications">{Locale.label("mobile.me.openInbox")}</TextLink>}>
            {recentNotifications.length === 0
              ? <QuietEmpty>{Locale.label("mobile.components.noNotifications")}</QuietEmpty>
              : (
                <RowList>
                  {recentNotifications.map((n, idx) => {
                    const href = deriveNotificationUrl(n);
                    return <Row key={n.id || `n-${idx}`} href={href} title={n.message || ""} subtitle={formatRelative(n.timeSent)} />;
                  })}
                </RowList>
              )}
            <Box sx={{ mt: "8px" }}>
              <TextLink href="/mobile/messages" data-testid="me-shortcut-messages">{Locale.label("mobile.screenTitles.messages")}</TextLink>
            </Box>
          </PlateSection>
        </Plate>
      </RecordLayout>
    </Box>
  );
};

export default MePage;
