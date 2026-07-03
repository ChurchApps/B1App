"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, Icon, IconButton, Skeleton, Typography } from "@mui/material";
import { ApiHelper, Locale, PersonHelper, UserHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { mobileTheme } from "../mobileTheme";
import { EventProcessor } from "../../helpers/eventProcessor";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";

interface Props {
  groupId: string;
  canManage: boolean;
  isMember?: boolean;
  onAddEvent: (dateIso: string) => void;
  onEditEvent?: (event: EventRow) => void;
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

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const formatMonth = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const formatTimeRange = (start?: string | Date, end?: string | Date, allDay?: boolean) => {
  if (!start) return "";
  if (allDay) return Locale.label("mobile.group.allDay");
  const s = new Date(start);
  if (isNaN(s.getTime())) return "";
  const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!end) return fmt(s);
  const e = new Date(end);
  if (isNaN(e.getTime())) return fmt(s);
  return `${fmt(s)} – ${fmt(e)}`;
};

export const GroupCalendarTab = ({ groupId, canManage, isMember, onAddEvent, onEditEvent }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selected, setSelected] = React.useState<string>(isoDate(new Date()));
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [rosterFor, setRosterFor] = React.useState<{ eventId: string; occurrenceStart: string; title: string } | null>(null);

  const { data: rawEvents, isLoading } = useQuery<EventRow[]>({
    queryKey: ["group-events", groupId],
    queryFn: async () => {
      const data = await ApiHelper.get(`/events/group/${groupId}`, "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId,
    placeholderData: []
  });

  const rsvpWindow = React.useMemo(() => ({
    from: startOfMonth(currentMonth).toISOString(),
    to: endOfMonth(currentMonth).toISOString()
  }), [currentMonth]);

  const { data: rsvpBatch = [] } = useQuery<RsvpBatchEntry[]>({
    queryKey: ["group-rsvps", groupId, rsvpWindow.from, rsvpWindow.to],
    queryFn: async () => {
      const data = await ApiHelper.get(`/events/rsvps/group/${groupId}?from=${encodeURIComponent(rsvpWindow.from)}&to=${encodeURIComponent(rsvpWindow.to)}`, "ContentApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!groupId && !!isMember,
    placeholderData: []
  });

  const rsvpByOccurrence = React.useMemo(() => {
    const map: Record<string, RsvpBatchEntry> = {};
    rsvpBatch.forEach((r) => {
      const key = `${r.eventId}|${occKey(new Date(r.occurrenceStart))}`;
      map[key] = r;
    });
    return map;
  }, [rsvpBatch]);

  const refreshRsvps = () => queryClient.invalidateQueries({ queryKey: ["group-rsvps", groupId] });

  const setRsvp = async (event: EventRow, occurrenceStart: Date, response: RsvpResponse | null) => {
    if (!event.id) return;
    const iso = occurrenceStart.toISOString();
    try {
      if (response === null) {
        await ApiHelper.delete(`/events/${event.id}/rsvp?occurrenceStart=${encodeURIComponent(iso)}`, "ContentApi");
      } else {
        await ApiHelper.post(`/events/${event.id}/rsvp`, { occurrenceStart: iso, response }, "ContentApi");
      }
      refreshRsvps();
    } catch {
      /* ignore — control reflects server on next refetch */
    }
  };

  const events = React.useMemo(() => {
    const normalized = EventProcessor.updateTime(rawEvents || []);
    const expanded = EventProcessor.expandEventsForMonth(normalized, currentMonth);
    return expanded as unknown as EventRow[];
  }, [rawEvents, currentMonth]);

  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    events.forEach((e) => {
      if (e.tags) {
        e.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((t) => tags.add(t));
      }
    });
    return Array.from(tags).sort();
  }, [events]);

  const filteredEvents = React.useMemo(() => {
    if (selectedTags.length === 0) return events;
    return events.filter((e) => {
      const tags = (e.tags || "").split(",").map((t) => t.trim());
      return selectedTags.some((st) => tags.includes(st));
    });
  }, [events, selectedTags]);

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

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));

  const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  const goPrev = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };
  const goNext = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  const handleAddEvent = () => {
    // Append T00:00:00 to parse as local time, not UTC (timezone gotcha).
    const base = selected ? new Date(`${selected}T00:00:00`) : new Date();
    if (!selected) base.setDate(base.getDate() + 1);
    base.setHours(14, 0, 0, 0);
    onAddEvent(base.toISOString());
  };

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
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

  const renderRsvp = (e: EventRow) => {
    if (!e.groupId || e.rsvpDisabled || !e.id) return null;
    const occ = e.start ? new Date(e.start) : null;
    if (!occ || isNaN(occ.getTime())) return null;
    const entry = rsvpByOccurrence[`${e.id}|${occKey(occ)}`];
    const mine = entry?.mine ?? null;
    const options: { value: RsvpResponse; label: string; color: string }[] = [
      { value: "yes", label: Locale.label("mobile.group.rsvpGoing"), color: tc.success },
      { value: "maybe", label: Locale.label("mobile.group.rsvpMaybe"), color: tc.warning },
      { value: "no", label: Locale.label("mobile.group.rsvpNotGoing"), color: tc.error }
    ];
    return (
      <Box sx={{ mt: 1.25, borderTop: `1px solid ${tc.border}`, pt: 1.25 }} data-testid={`rsvp-${e.id}`}>
        {isMember && (
          <>
            <Typography sx={{ fontSize: 12, color: tc.textSecondary, mb: 0.75 }}>{Locale.label("mobile.group.rsvpQuestion")}</Typography>
            <Box sx={{ display: "flex", gap: 0.75 }}>
              {options.map((opt) => {
                const active = mine === opt.value;
                const count = entry ? entry[opt.value] : 0;
                return (
                  <Button
                    key={opt.value}
                    size="small"
                    variant={active ? "contained" : "outlined"}
                    onClick={() => setRsvp(e, occ, active ? null : opt.value)}
                    data-testid={`rsvp-${e.id}-${opt.value}`}
                    sx={{
                      flex: 1,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: 12,
                      borderRadius: `${mobileTheme.radius.md}px`,
                      bgcolor: active ? opt.color : "transparent",
                      color: active ? "#fff" : opt.color,
                      borderColor: opt.color,
                      "&:hover": { bgcolor: active ? opt.color : `${opt.color}1A`, borderColor: opt.color }
                    }}
                  >
                    {opt.label}{count > 0 ? ` ${count}` : ""}
                  </Button>
                );
              })}
            </Box>
          </>
        )}
        {canManage && (
          <Button
            size="small"
            onClick={() => setRosterFor({ eventId: e.id!, occurrenceStart: occ.toISOString(), title: e.title || Locale.label("mobile.group.event") })}
            startIcon={<Icon sx={{ fontSize: 16 }}>groups</Icon>}
            data-testid={`rsvp-roster-${e.id}`}
            sx={{ mt: 0.75, textTransform: "none", fontSize: 12, color: tc.primary }}
          >
            {Locale.label("mobile.group.rsvpViewResponses")}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: `${mobileTheme.spacing.sm}px`
        }}
      >
        {canManage && (
          <Button
            variant="contained"
            fullWidth
            onClick={handleAddEvent}
            startIcon={<Icon>event</Icon>}
            sx={{
              bgcolor: tc.success,
              color: "#000",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: `${mobileTheme.radius.md}px`,
              py: "10px",
              "&:hover": { bgcolor: tc.success }
            }}
          >
            {Locale.label("mobile.group.addEvent")}
          </Button>
        )}
        <Button
          variant="outlined"
          fullWidth
          onClick={handleSubscribe}
          startIcon={<Icon>calendar_month</Icon>}
          sx={{
            borderColor: tc.primary,
            color: tc.primary,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: `${mobileTheme.radius.md}px`,
            py: "10px"
          }}
        >
          {Locale.label("mobile.group.subscribe")}
        </Button>
      </Box>

      {allTags.length > 0 && (
        <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 0.5 }}>
          {allTags.map((t) => (
            <Chip
              key={t}
              label={t}
              onClick={() => toggleTag(t)}
              variant={selectedTags.includes(t) ? "filled" : "outlined"}
              sx={{
                bgcolor: selectedTags.includes(t) ? tc.primaryLight : undefined,
                color: selectedTags.includes(t) ? tc.primary : tc.text,
                borderColor: tc.primary,
                fontWeight: 500
              }}
              size="small"
            />
          ))}
          {selectedTags.length > 0 && (
            <Chip
              label={Locale.label("mobile.group.clear")}
              onDelete={() => setSelectedTags([])}
              onClick={() => setSelectedTags([])}
              size="small"
            />
          )}
        </Box>
      )}

      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <IconButton onClick={goPrev} aria-label={Locale.label("mobile.group.previousMonth")} size="small" sx={{ color: tc.primary }}>
            <Icon>chevron_left</Icon>
          </IconButton>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text }}>
            {formatMonth(currentMonth)}
          </Typography>
          <IconButton onClick={goNext} aria-label={Locale.label("mobile.group.nextMonth")} size="small" sx={{ color: tc.primary }}>
            <Icon>chevron_right</Icon>
          </IconButton>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
          {weekdayLabels.map((w, i) => (
            <Box
              key={`wd-${i}`}
              sx={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: tc.primary, py: "4px" }}
            >
              {w}
            </Box>
          ))}
          {days.map((d, i) => {
            if (!d) return <Box key={`e-${i}`} />;
            const key = isoDate(d);
            const isSelected = key === selected;
            const hasEvents = !!eventsByDate[key]?.length;
            const isToday = key === isoDate(new Date());
            return (
              <Box
                key={key}
                role="button"
                tabIndex={0}
                data-testid={`day-${key}`}
                onClick={() => setSelected(key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(key);
                  }
                }}
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 66,
                  aspectRatio: "1 / 1",
                  justifySelf: "center",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  bgcolor: isSelected ? tc.primary : "transparent",
                  color: isSelected ? tc.onPrimary : isToday ? tc.primary : tc.text,
                  fontSize: 14,
                  fontWeight: isToday || isSelected ? 700 : 500,
                  "&:hover": { bgcolor: isSelected ? tc.primary : tc.iconBackground }
                }}
              >
                {d.getDate()}
                {hasEvents && !isSelected && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 4,
                      width: 4,
                      height: 4,
                      borderRadius: "2px",
                      bgcolor: tc.primary
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text, mb: 1 }}>
          {new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric"
          })}
        </Typography>
        {isLoading && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[0, 1].map((i) => (
              <Skeleton key={`es-${i}`} variant="rounded" height={60} sx={{ borderRadius: `${mobileTheme.radius.lg}px` }} />
            ))}
          </Box>
        )}
        {!isLoading && selectedEvents.length === 0 && (
          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              p: `${mobileTheme.spacing.md}px`,
              textAlign: "center"
            }}
          >
            <Typography sx={{ fontSize: 14, color: tc.textMuted }}>{Locale.label("mobile.group.noEventsToday")}</Typography>
          </Box>
        )}
        {!isLoading && selectedEvents.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
            {selectedEvents.map((e, i) => (
              <Box
                key={e.id || `ev-${i}`}
                sx={{
                  bgcolor: tc.surface,
                  borderRadius: `${mobileTheme.radius.lg}px`,
                  boxShadow: mobileTheme.shadows.sm,
                  p: `${mobileTheme.spacing.md}px`,
                  borderLeft: `4px solid ${tc.primary}`,
                  position: "relative"
                }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>
                      {e.title || Locale.label("mobile.group.event")}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: tc.textSecondary, mt: "2px" }}>
                      {formatTimeRange(e.start, e.end, e.allDay)}
                    </Typography>
                    {(e.visibility === "private" || e.recurrenceRule || e.allDay) && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: "6px" }}>
                        {e.visibility === "private" && (
                          <Chip
                            size="small"
                            icon={<Icon sx={{ fontSize: 14 }}>lock</Icon>}
                            label={Locale.label("mobile.group.private")}
                            sx={{
                              height: 22,
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: tc.iconBackground,
                              color: tc.textSecondary,
                              "& .MuiChip-icon": { color: tc.textSecondary, ml: "4px" }
                            }}
                          />
                        )}
                        {e.allDay && (
                          <Chip
                            size="small"
                            label={Locale.label("mobile.group.allDay")}
                            sx={{
                              height: 22,
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: tc.primaryLight,
                              color: tc.primary
                            }}
                          />
                        )}
                        {e.recurrenceRule && (
                          <Chip
                            size="small"
                            icon={<Icon sx={{ fontSize: 14 }}>autorenew</Icon>}
                            label={describeRecurrence(e.recurrenceRule)}
                            sx={{
                              height: 22,
                              fontSize: 11,
                              fontWeight: 600,
                              bgcolor: tc.iconBackground,
                              color: tc.text,
                              "& .MuiChip-icon": { color: tc.primary, ml: "4px" }
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                  {canManage && onEditEvent && (
                    <IconButton
                      size="small"
                      aria-label={Locale.label("mobile.group.editEvent")}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onEditEvent(e);
                      }}
                      sx={{ color: tc.primary, ml: "auto", mt: "-4px" }}
                    >
                      <Icon sx={{ fontSize: 18 }}>edit</Icon>
                    </IconButton>
                  )}
                </Box>
                {e.description && (
                  // <Typography
                  //   sx={{
                  //     fontSize: 13,
                  //     color: tc.textMuted,
                  //     mt: "6px",
                  //     whiteSpace: "pre-wrap",
                  //     display: "-webkit-box",
                  //     WebkitLineClamp: 3,
                  //     WebkitBoxOrient: "vertical",
                  //     overflow: "hidden"
                  //   }}
                  // >
                  //   {e.description}
                  // </Typography>
                  <MarkdownPreviewLight value={e.description} />
                )}
                {e.registrationEnabled && e.id && (
                  <Box sx={{ mt: 1.25, display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={(ev) => { ev.stopPropagation(); router.push(`/mobile/register/${e.id}`); }}
                      sx={{
                        bgcolor: tc.success,
                        color: "#000",
                        textTransform: "none",
                        fontWeight: 600,
                        borderRadius: `${mobileTheme.radius.md}px`,
                        px: 2,
                        "&:hover": { bgcolor: tc.success }
                      }}
                    >
                      {Locale.label("mobile.group.register")}
                    </Button>
                  </Box>
                )}
                {renderRsvp(e)}
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <RsvpRosterDialog
        target={rosterFor}
        onClose={() => setRosterFor(null)}
      />
    </Box>
  );
};

interface RosterTarget { eventId: string; occurrenceStart: string; title: string }

const RsvpRosterDialog = ({ target, onClose }: { target: RosterTarget | null; onClose: () => void }) => {
  const tc = mobileTheme.colors;
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

  const groups: { key: RsvpResponse; label: string; color: string }[] = [
    { key: "yes", label: Locale.label("mobile.group.rsvpGoing"), color: tc.success },
    { key: "maybe", label: Locale.label("mobile.group.rsvpMaybe"), color: tc.warning },
    { key: "no", label: Locale.label("mobile.group.rsvpNotGoing"), color: tc.error }
  ];

  return (
    <Dialog open={!!target} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: `${mobileTheme.radius.xl}px` } }}>
      <DialogTitle sx={{ fontSize: 18, fontWeight: 700, color: tc.text }}>
        {Locale.label("mobile.group.rsvpResponses")}
      </DialogTitle>
      <DialogContent>
        {isLoading && <Skeleton variant="rounded" height={80} />}
        {!isLoading && roster.length === 0 && (
          <Typography sx={{ fontSize: 14, color: tc.textMuted }}>{Locale.label("mobile.group.rsvpNoResponses")}</Typography>
        )}
        {!isLoading && groups.map((g) => {
          const rows = roster.filter((r) => r.response === g.key);
          if (rows.length === 0) return null;
          return (
            <Box key={g.key} sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: g.color, mb: 0.5 }}>
                {g.label} · {rows.length}
              </Typography>
              {rows.map((r) => {
                const p = people[r.personId];
                const photo = p ? (() => { try { return PersonHelper.getPhotoUrl(p); } catch { return ""; } })() : "";
                const name = p?.name?.display || Locale.label("mobile.components.unknown");
                return (
                  <Box key={r.personId} sx={{ display: "flex", alignItems: "center", gap: 1, py: "4px" }}>
                    {photo ? (
                      <Box component="img" src={photo} alt={name} sx={{ width: 32, height: 32, borderRadius: "16px", objectFit: "cover" }} />
                    ) : (
                      <Box sx={{ width: 32, height: 32, borderRadius: "16px", bgcolor: tc.primaryLight, color: tc.primary, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {(name[0] || "?").toUpperCase()}
                      </Box>
                    )}
                    <Typography sx={{ fontSize: 14, color: tc.text }}>{name}</Typography>
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </DialogContent>
    </Dialog>
  );
};

export default GroupCalendarTab;
