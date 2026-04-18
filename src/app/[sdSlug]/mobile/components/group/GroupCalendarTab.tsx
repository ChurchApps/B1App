"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Chip, Icon, IconButton, Skeleton, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  groupId: string;
  isLeader: boolean;
  onAddEvent: (dateIso: string) => void;
}

interface EventRow {
  id?: string;
  groupId?: string;
  title?: string;
  description?: string;
  start?: string | Date;
  end?: string | Date;
  allDay?: boolean;
  recurrenceRule?: string;
  tags?: string;
  registrationEnabled?: boolean;
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

const formatMonth = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const formatTimeRange = (start?: string | Date, end?: string | Date, allDay?: boolean) => {
  if (!start) return "";
  if (allDay) return "All day";
  const s = new Date(start);
  if (isNaN(s.getTime())) return "";
  const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (!end) return fmt(s);
  const e = new Date(end);
  if (isNaN(e.getTime())) return fmt(s);
  return `${fmt(s)} – ${fmt(e)}`;
};

export const GroupCalendarTab = ({ groupId, isLeader, onAddEvent }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selected, setSelected] = React.useState<string>(isoDate(new Date()));
  const [events, setEvents] = React.useState<EventRow[] | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

  const loadEvents = React.useCallback(
    async (month: Date) => {
      if (!groupId) return;
      setEvents(null);
      const from = startOfMonth(month);
      const to = endOfMonth(month);
      try {
        const data: EventRow[] = await ApiHelper.get(
          `/events/group/${groupId}?from=${from.toISOString()}&to=${to.toISOString()}`,
          "ContentApi"
        );
        setEvents(Array.isArray(data) ? data : []);
      } catch {
        setEvents([]);
      }
    },
    [groupId]
  );

  React.useEffect(() => {
    loadEvents(currentMonth);
  }, [currentMonth, loadEvents]);

  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    (events || []).forEach((e) => {
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
    if (selectedTags.length === 0) return events || [];
    return (events || []).filter((e) => {
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
    const base = new Date(selected);
    base.setHours(14, 0, 0, 0);
    onAddEvent(base.toISOString());
  };

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
      {/* Header / controls */}
      <Box
        sx={{
          display: "flex",
          gap: `${mobileTheme.spacing.sm}px`,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {isLeader && (
          <Button
            variant="contained"
            onClick={handleAddEvent}
            startIcon={<Icon>event</Icon>}
            sx={{
              bgcolor: tc.success,
              color: "#000",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: `${mobileTheme.radius.md}px`,
              "&:hover": { bgcolor: tc.success },
            }}
          >
            Add Event
          </Button>
        )}
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
                fontWeight: 500,
              }}
              size="small"
            />
          ))}
          {selectedTags.length > 0 && (
            <Chip
              label="Clear"
              onDelete={() => setSelectedTags([])}
              onClick={() => setSelectedTags([])}
              size="small"
            />
          )}
        </Box>
      )}

      {/* Calendar grid */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          p: `${mobileTheme.spacing.md}px`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <IconButton onClick={goPrev} aria-label="Previous month" size="small" sx={{ color: tc.primary }}>
            <Icon>chevron_left</Icon>
          </IconButton>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text }}>
            {formatMonth(currentMonth)}
          </Typography>
          <IconButton onClick={goNext} aria-label="Next month" size="small" sx={{ color: tc.primary }}>
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
                onClick={() => setSelected(key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(key);
                  }
                }}
                sx={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  bgcolor: isSelected ? tc.primary : "transparent",
                  color: isSelected ? tc.onPrimary : isToday ? tc.primary : tc.text,
                  fontSize: 14,
                  fontWeight: isToday || isSelected ? 700 : 500,
                  "&:hover": { bgcolor: isSelected ? tc.primary : tc.iconBackground },
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
                      bgcolor: tc.primary,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Events for selected date */}
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text, mb: 1 }}>
          {new Date(selected).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Typography>
        {events === null && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {[0, 1].map((i) => (
              <Skeleton key={`es-${i}`} variant="rounded" height={60} sx={{ borderRadius: `${mobileTheme.radius.lg}px` }} />
            ))}
          </Box>
        )}
        {events !== null && selectedEvents.length === 0 && (
          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              p: `${mobileTheme.spacing.md}px`,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: 14, color: tc.textMuted }}>No events on this day.</Typography>
          </Box>
        )}
        {events !== null && selectedEvents.length > 0 && (
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
                }}
              >
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>
                  {e.title || "Event"}
                </Typography>
                <Typography sx={{ fontSize: 12, color: tc.textSecondary, mt: "2px" }}>
                  {formatTimeRange(e.start, e.end, e.allDay)}
                </Typography>
                {e.description && (
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: tc.textMuted,
                      mt: "6px",
                      whiteSpace: "pre-wrap",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {e.description}
                  </Typography>
                )}
                {e.registrationEnabled && e.id && (
                  <Box sx={{ mt: 1.25, display: "flex", justifyContent: "flex-end" }}>
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
                        px: 2,
                        "&:hover": { bgcolor: tc.success },
                      }}
                    >
                      Register
                    </Button>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default GroupCalendarTab;
