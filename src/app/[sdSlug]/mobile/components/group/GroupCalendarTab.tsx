"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, CircularProgress, IconButton, Skeleton, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ViewListIcon from "@mui/icons-material/ViewList";
import { ApiHelper, Locale, PersonHelper, UserHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { rotateWeekdays, weekdayColumn } from "@/helpers/firstDayOfWeek";
import { mobileTheme } from "../mobileTheme";
import { EventProcessor } from "../../helpers/eventProcessor";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { DateHelper } from "@churchapps/helpers";
import { Eyebrow, FilterPills, PersonAvatar, PlateSection, QuietEmpty, Sheet, StatusBadge, TextLink, type BadgeTone, ViewToggle } from "../kit";

interface Props {
  groupId: string;
  canManage: boolean;
  isMember?: boolean;
  onAddEvent: (dateIso: string) => void;
  onEditEvent?: (event: EventRow) => void;
  firstDayOfWeek?: number;
}

type RsvpResponse = "yes" | "no" | "maybe";

interface RsvpBatchEntry {
  eventId: string;
  occurrenceStart: string;
  yes: number;
  no: number;
  maybe: number;
  mine: RsvpResponse | null;
}

export interface EventRow {
  id?: string;
  groupId?: string;
  title?: string;
  description?: string;
  start?: string | Date;
  end?: string | Date;
  allDay?: boolean;
  visibility?: string;
  recurrenceRule?: string;
  tags?: string;
  registrationEnabled?: boolean;
  rsvpDisabled?: boolean;
}

type ViewMode = "month" | "list";
const VIEW_MODE_KEY = "b1-group-events-view";

const tc = mobileTheme.colors;

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

// Local-time key for RSVP matching regardless of server datetime format.
const occKey = (d: Date) => {
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const describeRecurrence = (rule?: string) => {
  if (!rule) return "";
  const parts = rule.split(";").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    if (k) acc[k.toUpperCase()] = v || "";
    return acc;
  }, {});
  const freq = parts.FREQ;
  const interval = parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1;
  if (!freq) return Locale.label("mobile.group.repeats");
  const map: Record<string, string> = {
    DAILY: interval === 1 ? Locale.label("mobile.group.daily") : Locale.label("mobile.group.everyNDays").replace("{}", String(interval)),
    WEEKLY: interval === 1 ? Locale.label("mobile.group.weekly") : Locale.label("mobile.group.everyNWeeks").replace("{}", String(interval)),
    MONTHLY: interval === 1 ? Locale.label("mobile.group.monthly") : Locale.label("mobile.group.everyNMonths").replace("{}", String(interval)),
    YEARLY: interval === 1 ? Locale.label("mobile.group.yearly") : Locale.label("mobile.group.everyNYears").replace("{}", String(interval))
  };
  return map[freq] || Locale.label("mobile.group.repeats");
};

const formatMonth = (d: Date) => d.toLocaleDateString(DateHelper.locale, { month: "long", year: "numeric" });
const formatDay = (d: Date) => d.toLocaleDateString(DateHelper.locale, { weekday: "short", month: "short", day: "numeric" });

const formatTimeRange = (start?: string | Date, end?: string | Date, allDay?: boolean) => {
  if (!start) return "";
  if (allDay) return Locale.label("mobile.group.allDay");
  const s = new Date(start);
  if (isNaN(s.getTime())) return "";
  const fmt = (d: Date) => d.toLocaleTimeString(DateHelper.locale, { hour: "numeric", minute: "2-digit" });
  if (!end) return fmt(s);
  const e = new Date(end);
  if (isNaN(e.getTime())) return fmt(s);
  return `${fmt(s)} – ${fmt(e)}`;
};

const rsvpOptions = (): { value: RsvpResponse; label: string; tone: BadgeTone }[] => [
  { value: "yes", label: Locale.label("mobile.group.rsvpGoing"), tone: "ok" },
  { value: "maybe", label: Locale.label("mobile.group.rsvpMaybe"), tone: "warn" },
  { value: "no", label: Locale.label("mobile.group.rsvpNotGoing"), tone: "bad" }
];

const useGroupEvents = (groupId: string) => useQuery<EventRow[]>({
  queryKey: ["group-events", groupId],
  queryFn: async () => {
    const data = await ApiHelper.get(`/events/group/${groupId}`, "ContentApi");
    return Array.isArray(data) ? data : [];
  },
  enabled: !!groupId,
  placeholderData: []
});

const useGroupRsvps = (groupId: string, isMember: boolean, from: Date, to: Date) => {
  const queryClient = useQueryClient();
  const [loadingKey, setLoadingKey] = React.useState<string | null>(null);
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const { data: batch = [] } = useQuery<RsvpBatchEntry[]>({
    queryKey: ["group-rsvps", groupId, fromIso, toIso],
    queryFn: async () => {
      const data = await ApiHelper.get(`/events/rsvps/group/${groupId}?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`, "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId && isMember,
    placeholderData: []
  });

  const byOccurrence = React.useMemo(() => {
    const map: Record<string, RsvpBatchEntry> = {};
    batch.forEach((r) => { map[`${r.eventId}|${occKey(new Date(r.occurrenceStart))}`] = r; });
    return map;
  }, [batch]);

  const setRsvp = async (event: EventRow, occurrenceStart: Date, response: RsvpResponse | null) => {
    if (!event.id) return;
    const iso = occurrenceStart.toISOString();
    setLoadingKey(`${event.id}|${occKey(occurrenceStart)}|${response ?? "remove"}`);
    try {
      if (response === null) await ApiHelper.delete(`/events/${event.id}/rsvp?occurrenceStart=${encodeURIComponent(iso)}`, "ContentApi");
      else await ApiHelper.post(`/events/${event.id}/rsvp`, { occurrenceStart: iso, response }, "ContentApi");
      await queryClient.invalidateQueries({ queryKey: ["group-rsvps", groupId] });
    } catch {
      /* ignore — control reflects server on next refetch */
    } finally {
      setLoadingKey(null);
    }
  };

  const entryFor = (e: EventRow) => {
    const occ = e.start ? new Date(e.start) : null;
    if (!e.id || !occ || isNaN(occ.getTime())) return { occ: null, entry: undefined };
    return { occ, entry: byOccurrence[`${e.id}|${occKey(occ)}`] };
  };

  return { entryFor, loadingKey, setRsvp };
};

type RsvpState = ReturnType<typeof useGroupRsvps>;

const canRsvp = (e: EventRow) => !!e.groupId && !e.rsvpDisabled && !!e.id;

const MyRsvpBadge = ({ entry }: { entry?: RsvpBatchEntry }) => {
  const opt = rsvpOptions().find((o) => o.value === entry?.mine);
  return opt ? <StatusBadge tone={opt.tone} dot={opt.value === "yes"}>{opt.label}</StatusBadge> : null;
};

const RsvpButtons = ({ e, rsvp }: { e: EventRow; rsvp: RsvpState }) => {
  const { occ, entry } = rsvp.entryFor(e);
  if (!occ) return null;
  const thisOccKey = `${e.id}|${occKey(occ)}`;
  const isAnyLoading = !!rsvp.loadingKey?.startsWith(thisOccKey);
  return (
    <Box role="group" aria-label={Locale.label("mobile.group.rsvpQuestion")} sx={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {rsvpOptions().map((opt) => {
        const active = entry?.mine === opt.value;
        const count = entry ? entry[opt.value] : 0;
        const isThisLoading = rsvp.loadingKey === `${thisOccKey}|${active ? "remove" : opt.value}`;
        return (
          <Button
            key={opt.value}
            size="small"
            variant="outlined"
            aria-pressed={active}
            disabled={isAnyLoading}
            onClick={() => rsvp.setRsvp(e, occ, active ? null : opt.value)}
            data-testid={`rsvp-${e.id}-${opt.value}`}
            sx={{ minHeight: 34, ...(active ? { bgcolor: tc.selected, color: tc.onSelected, borderColor: "transparent", "&:hover": { bgcolor: tc.selected, borderColor: "transparent" } } : {}) }}
          >
            {isThisLoading ? <CircularProgress size={14} thickness={5} color="inherit" /> : <>{opt.label}{count > 0 ? ` ${count}` : ""}</>}
          </Button>
        );
      })}
    </Box>
  );
};

// Plate teaser: the next occurrence with inline RSVP.
export const GroupNextEvent = ({ groupId, isMember }: { groupId: string; isMember: boolean }) => {
  const { data: rawEvents, isLoading } = useGroupEvents(groupId);
  const [now] = React.useState(() => new Date());
  const range = React.useMemo(() => ({ from: startOfMonth(now), to: endOfMonth(new Date(now.getFullYear(), now.getMonth() + 2, 1)) }), [now]);
  const rsvp = useGroupRsvps(groupId, isMember, range.from, range.to);

  const next = React.useMemo(() => {
    const normalized = EventProcessor.updateTime(rawEvents || []);
    for (let i = 0; i < 3; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const upcoming = (EventProcessor.expandEventsForMonth(normalized, month) as unknown as EventRow[])
        .filter((e) => e.start && new Date(e.end || e.start) >= now)
        .sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime());
      if (upcoming.length) return upcoming[0];
    }
    return null;
  }, [rawEvents, now]);

  if (isLoading) return <Skeleton variant="text" width="60%" height={28} />;
  if (!next) return <QuietEmpty>{Locale.label("mobile.group.noUpcomingEvents")}</QuietEmpty>;

  const { entry } = rsvp.entryFor(next);
  const start = new Date(next.start!);
  const meta = [formatDay(start), formatTimeRange(next.start, next.end, next.allDay), entry?.yes ? Locale.label("mobile.group.nGoing").replace("{}", String(entry.yes)) : ""].filter(Boolean).join(" · ");
  return (
    <Box data-testid="group-next-event">
      <Typography sx={{ fontSize: 17, lineHeight: "24px", fontWeight: 600, color: tc.text }}>{next.title || Locale.label("mobile.group.event")}</Typography>
      <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>{meta}</Typography>
      {(next.registrationEnabled && next.id) && <Box sx={{ mt: "10px" }}><TextLink href={`/mobile/register/${next.id}`}>{Locale.label("mobile.group.register")}</TextLink></Box>}
      {isMember && canRsvp(next) && <Box sx={{ mt: "12px" }}><RsvpButtons e={next} rsvp={rsvp} /></Box>}
    </Box>
  );
};

export const GroupCalendarTab = ({ groupId, canManage, isMember, onAddEvent, onEditEvent, firstDayOfWeek = 0 }: Props) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selected, setSelected] = React.useState<string>(isoDate(new Date()));
  const [selectedTag, setSelectedTag] = React.useState<string>("");
  const [rosterFor, setRosterFor] = React.useState<{ eventId: string; occurrenceStart: string; title: string } | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("month");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      if (saved === "month" || saved === "list") setViewMode(saved);
    } catch { /* storage blocked — keep month view */ }
  }, []);

  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch { /* storage blocked */ }
  };

  const { data: rawEvents, isLoading } = useGroupEvents(groupId);
  const rsvp = useGroupRsvps(groupId, !!isMember, startOfMonth(currentMonth), endOfMonth(currentMonth));

  const events = React.useMemo(() => {
    const normalized = EventProcessor.updateTime(rawEvents || []);
    return EventProcessor.expandEventsForMonth(normalized, currentMonth) as unknown as EventRow[];
  }, [rawEvents, currentMonth]);

  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    events.forEach((e) => (e.tags || "").split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    if (!selectedTag) return events;
    return events.filter((e) => (e.tags || "").split(",").map((t) => t.trim()).includes(selectedTag));
  }, [events, selectedTag]);

  const eventsByDate = React.useMemo(() => {
    const map: Record<string, EventRow[]> = {};
    filteredEvents.forEach((e) => {
      if (!e.start) return;
      const d = new Date(e.start);
      if (isNaN(d.getTime())) return;
      const key = isoDate(d);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return map;
  }, [filteredEvents]);

  const selectedEvents = eventsByDate[selected] || [];

  // List view: this month's occurrences in date order, from today onward when viewing the current month.
  const listGroups = React.useMemo(() => {
    const now = new Date();
    const isCurrentMonth = currentMonth.getFullYear() === now.getFullYear() && currentMonth.getMonth() === now.getMonth();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const rows = filteredEvents
      .filter((e) => {
        if (!e.start) return false;
        const d = new Date(e.start);
        if (isNaN(d.getTime())) return false;
        return !isCurrentMonth || d >= startOfToday;
      })
      .sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime());
    const groups: { key: string; events: EventRow[] }[] = [];
    rows.forEach((e) => {
      const key = isoDate(new Date(e.start!));
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.events.push(e);
      else groups.push({ key, events: [e] });
    });
    return groups;
  }, [filteredEvents, currentMonth]);

  const monthStart = startOfMonth(currentMonth);
  const firstWeekday = weekdayColumn(monthStart.getDay(), firstDayOfWeek);
  const daysInMonth = endOfMonth(currentMonth).getDate();
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
  const weekdayLabels = rotateWeekdays(["S", "M", "T", "W", "T", "F", "S"], firstDayOfWeek);
  const todayKey = isoDate(new Date());

  const shiftMonth = (delta: number) => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const handleAddEvent = () => {
    // Append T00:00:00 to parse as local time, not UTC (timezone gotcha).
    const base = selected ? new Date(`${selected}T00:00:00`) : new Date();
    if (!selected) base.setDate(base.getDate() + 1);
    base.setHours(14, 0, 0, 0);
    onAddEvent(base.toISOString());
  };

  const handleSubscribe = () => {
    const churchId = UserHelper.currentUserChurch?.church?.id;
    const contentApi = EnvironmentHelper.Common?.ContentApi || "";
    if (!contentApi) return;
    const httpsUrl = `${contentApi}/events/subscribe?groupId=${groupId}${churchId ? `&churchId=${churchId}` : ""}`;
    const webcalUrl = httpsUrl.replace(/^https?:\/\//, "webcal://");
    if (typeof window !== "undefined") {
      try {
        window.location.href = webcalUrl;
      } catch {
        window.open(httpsUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  const renderEvent = (e: EventRow, i: number) => {
    const meta = [
      formatTimeRange(e.start, e.end, e.allDay),
      e.recurrenceRule ? describeRecurrence(e.recurrenceRule) : "",
      e.visibility === "private" ? Locale.label("mobile.group.private") : ""
    ].filter(Boolean).join(" · ");
    const occ = e.start ? new Date(e.start) : null;
    const showRsvp = canRsvp(e) && !!occ && !isNaN(occ.getTime());
    return (
      <Box key={`${e.id || "ev"}-${i}`} sx={{ py: "12px", "& + &": { borderTop: `1px solid ${tc.border}` } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, lineHeight: "21px", fontWeight: 500, color: tc.text, overflowWrap: "anywhere" }}>{e.title || Locale.label("mobile.group.event")}</Typography>
            <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>{meta}</Typography>
          </Box>
          {isMember && showRsvp && <MyRsvpBadge entry={rsvp.entryFor(e).entry} />}
          {canManage && onEditEvent && (
            <IconButton size="small" aria-label={Locale.label("mobile.group.editEvent")} onClick={() => onEditEvent(e)} sx={{ color: tc.textSecondary, mt: "-6px" }}>
              <EditOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
        {e.description && (
          <Box sx={{ mt: "6px", fontSize: 14, lineHeight: "20px", color: tc.textSecondary, "& p": { m: 0 } }}>
            <MarkdownPreviewLight value={e.description} />
          </Box>
        )}
        {e.registrationEnabled && e.id && (
          <Box sx={{ mt: "8px" }}><TextLink href={`/mobile/register/${e.id}`}>{Locale.label("mobile.group.register")}</TextLink></Box>
        )}
        {showRsvp && (isMember || canManage) && (
          <Box sx={{ mt: "10px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "8px" }} data-testid={`rsvp-${e.id}`}>
            {isMember && <RsvpButtons e={e} rsvp={rsvp} />}
            {canManage && (
              <TextLink onClick={() => setRosterFor({ eventId: e.id!, occurrenceStart: occ!.toISOString(), title: e.title || Locale.label("mobile.group.event") })} data-testid={`rsvp-roster-${e.id}`}>
                {Locale.label("mobile.group.rsvpViewResponses")}
              </TextLink>
            )}
          </Box>
        )}
      </Box>
    );
  };

  const loadingRows = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={52} />)}
    </Box>
  );

  return (
    <>
      <PlateSection>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          {canManage ? <Button variant="contained" onClick={handleAddEvent} startIcon={<AddIcon />}>{Locale.label("mobile.group.addEvent")}</Button> : <span />}
          <ViewToggle
            label={Locale.label("mobile.details.tabEvents")}
            value={viewMode}
            onChange={changeViewMode}
            options={[
              { value: "list", label: Locale.label("mobile.group.list"), icon: <ViewListIcon /> },
              { value: "month", label: Locale.label("mobile.group.calendar"), icon: <CalendarMonthIcon /> }
            ]}
          />
        </Box>
        {allTags.length > 0 && (
          <Box sx={{ mt: "14px" }}>
            <FilterPills
              label={Locale.label("mobile.group.tags")}
              value={selectedTag}
              onChange={setSelectedTag}
              options={[{ value: "", label: Locale.label("mobile.group.selectAll") }, ...allTags.map((t) => ({ value: t, label: t }))]}
            />
          </Box>
        )}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: "16px" }}>
          <Typography component="h2" sx={{ fontSize: 17, lineHeight: "24px", fontWeight: 600, color: tc.text }}>{formatMonth(currentMonth)}</Typography>
          <Box sx={{ display: "flex", mr: "-8px" }}>
            <IconButton onClick={() => shiftMonth(-1)} aria-label={Locale.label("mobile.group.previousMonth")} sx={{ color: tc.text }}><ChevronLeftIcon /></IconButton>
            <IconButton onClick={() => shiftMonth(1)} aria-label={Locale.label("mobile.group.nextMonth")} sx={{ color: tc.text }}><ChevronRightIcon /></IconButton>
          </Box>
        </Box>
        {viewMode === "month" && (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "4px", mt: "6px", textAlign: "center" }}>
            {weekdayLabels.map((w, i) => (
              <Box key={`wd-${i}`} data-testid={`weekday-${i}`} sx={{ height: 24, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", color: tc.textSecondary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {w}
              </Box>
            ))}
            {days.map((d, i) => {
              if (!d) return <Box key={`e-${i}`} />;
              const key = isoDate(d);
              const isSelected = key === selected;
              const hasEvents = !!eventsByDate[key]?.length;
              return (
                <Box
                  key={key}
                  component="button"
                  type="button"
                  aria-pressed={isSelected}
                  data-testid={`day-${key}`}
                  onClick={() => setSelected(key)}
                  sx={{
                    height: 42,
                    border: 0,
                    borderRadius: "8px",
                    font: "inherit",
                    fontSize: 14,
                    fontWeight: isSelected ? 650 : 400,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                    bgcolor: isSelected ? tc.selected : "transparent",
                    color: isSelected ? tc.onSelected : tc.text,
                    boxShadow: key === todayKey && !isSelected ? `inset 0 0 0 1px ${tc.control}` : "none"
                  }}
                >
                  {d.getDate()}
                  {hasEvents && <Box component="i" sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: tc.primary }} />}
                </Box>
              );
            })}
          </Box>
        )}
      </PlateSection>

      <PlateSection>
        {viewMode === "month" ? (
          <>
            <Eyebrow component="h3">{formatDay(new Date(selected + "T00:00:00"))}</Eyebrow>
            {isLoading && loadingRows}
            {!isLoading && selectedEvents.length === 0 && <QuietEmpty sx={{ mt: "8px" }}>{Locale.label("mobile.group.noEventsToday")}</QuietEmpty>}
            {!isLoading && selectedEvents.length > 0 && <Box>{selectedEvents.map(renderEvent)}</Box>}
          </>
        ) : (
          <Box data-testid="group-events-list">
            {isLoading && loadingRows}
            {!isLoading && listGroups.length === 0 && <QuietEmpty>{Locale.label("mobile.group.noUpcomingEventsMonth")}</QuietEmpty>}
            {!isLoading && listGroups.map((g, gi) => (
              <Box key={g.key} data-testid={`list-day-${g.key}`} sx={{ mt: gi ? "14px" : 0 }}>
                <Eyebrow component="h3">{formatDay(new Date(g.key + "T00:00:00"))}</Eyebrow>
                <Box>{g.events.map(renderEvent)}</Box>
              </Box>
            ))}
          </Box>
        )}
      </PlateSection>

      <PlateSection>
        <TextLink onClick={handleSubscribe}>{Locale.label("mobile.group.subscribe")}</TextLink>
      </PlateSection>

      <RsvpRosterSheet target={rosterFor} onClose={() => setRosterFor(null)} />
    </>
  );
};

interface RosterTarget { eventId: string; occurrenceStart: string; title: string }

const RsvpRosterSheet = ({ target, onClose }: { target: RosterTarget | null; onClose: () => void }) => {
  const { data: roster = [], isLoading } = useQuery<{ personId: string; response: RsvpResponse }[]>({
    queryKey: ["rsvp-roster", target?.eventId, target?.occurrenceStart],
    queryFn: async () => {
      const data = await ApiHelper.get(`/events/${target!.eventId}/rsvps?occurrenceStart=${encodeURIComponent(target!.occurrenceStart)}`, "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!target
  });

  const [people, setPeople] = React.useState<Record<string, PersonInterface>>({});
  React.useEffect(() => {
    const ids = Array.from(new Set(roster.map((r) => r.personId).filter(Boolean)));
    if (ids.length === 0) return;
    ApiHelper.get(`/people/basic?ids=${ids.join(",")}`, "MembershipApi")
      .then((p: PersonInterface[]) => {
        if (!Array.isArray(p)) return;
        const map: Record<string, PersonInterface> = {};
        p.forEach((x) => { if (x.id) map[x.id] = x; });
        setPeople(map);
      })
      .catch(() => { /* names fall back to Unknown */ });
  }, [roster]);

  return (
    <Sheet open={!!target} onClose={onClose} title={Locale.label("mobile.group.rsvpResponses")} maxWidth="xs">
      {isLoading && <Skeleton variant="rounded" height={80} />}
      {!isLoading && roster.length === 0 && <QuietEmpty>{Locale.label("mobile.group.rsvpNoResponses")}</QuietEmpty>}
      {!isLoading && rsvpOptions().map((g) => {
        const rows = roster.filter((r) => r.response === g.value);
        if (rows.length === 0) return null;
        return (
          <Box key={g.value} sx={{ mb: "16px" }}>
            <StatusBadge tone={g.tone}>{g.label} · {rows.length}</StatusBadge>
            {rows.map((r) => {
              const p = people[r.personId];
              const photo = p ? (() => { try { return PersonHelper.getPhotoUrl(p); } catch { return ""; } })() : "";
              const name = p?.name?.display || Locale.label("mobile.components.unknown");
              return (
                <Box key={r.personId} sx={{ display: "flex", alignItems: "center", gap: "10px", py: "6px" }}>
                  <PersonAvatar name={name} src={photo || undefined} size={32} />
                  <Typography sx={{ fontSize: 15, color: tc.text }}>{name}</Typography>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Sheet>
  );
};

export default GroupCalendarTab;
