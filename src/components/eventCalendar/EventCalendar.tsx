import { Calendar, dayjsLocalizer, View } from "react-big-calendar";
import dayjs from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Chip, Snackbar, Stack } from "@mui/material";
import { EventHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { SmallButton } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import type { EventInterface } from "@churchapps/helpers";
import { useState, useCallback, useMemo } from "react";
import { EditEventModal } from "./EditEventModal";
import { DisplayEventModal } from "./DisplayEventModal";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";

interface Props {
  events: EventInterface[];
  editGroupId?: string;
  onRequestRefresh?: () => void;
}

export function EventCalendar(props: Props) {
  const localizer = dayjsLocalizer(dayjs);
  const [editEvent, setEditEvent] = useState<EventInterface | null>(null);
  const [displayEvent, setDisplayEvent] = useState<EventInterface | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>("month");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    props.events.forEach((ev) => {
      if (ev.tags) ev.tags.split(",").forEach((t) => { const trimmed = t.trim(); if (trimmed) tagSet.add(trimmed); });
    });
    return Array.from(tagSet).sort();
  }, [props.events]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const filteredEvents = useMemo(() => {
    if (selectedTags.length === 0) return props.events;
    return props.events.filter((ev) => {
      if (!ev.tags) return false;
      const eventTags = ev.tags.split(",").map((t) => t.trim());
      return selectedTags.some((tag) => eventTags.includes(tag));
    });
  }, [props.events, selectedTags]);

  const handleSubscribe = () => {
    setOpen(true);
    navigator.clipboard.writeText(`${EnvironmentHelper.Common.ContentApi}/events/subscribe?groupId=${props.editGroupId}&churchId=${UserHelper.currentUserChurch.church.id}`);
  };

  const handleAddEvent = (slotInfo: { start: Date; end: Date }) => {
    const startTime = new Date(slotInfo.start);
    startTime.setHours(12);
    startTime.setMinutes(0);
    startTime.setSeconds(0);
    const endTime = new Date(slotInfo.start);
    endTime.setHours(13);
    endTime.setMinutes(0);
    endTime.setSeconds(0);
    setEditEvent({ start: startTime, end: endTime, allDay: false, groupId: props.editGroupId, visibility: "public" });
  };

  const handleEventClick = (event: EventInterface) => {
    const ev = { ...event };
    setDisplayEvent(ev);
  };

  const handleDone = () => {
    setDisplayEvent(null);
    setEditEvent(null);
    if (props.onRequestRefresh) props.onRequestRefresh();
  };

  const onNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const onView = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const expandedEvents: EventInterface[] = [];
  const startRange = new Date();
  const endRange = new Date();
  startRange.setFullYear(startRange.getFullYear() - 1);
  endRange.setFullYear(endRange.getFullYear() + 1);

  filteredEvents.forEach((event) => {
    const ev = { ...event };
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    if (event.recurrenceRule) {
      const dates = EventHelper.getRange(event, startRange, endRange);
      dates.forEach((date: Date) => {
        const ev = { ...event };
        const diff = new Date(ev.end).getTime() - new Date(ev.start).getTime();
        ev.start = date;
        ev.end = new Date(date.getTime() + diff);
        expandedEvents.push(ev);
      });
      EventHelper.removeExcludeDates(expandedEvents);
    } else expandedEvents.push(ev);
  });

  return (
    <div>
      {props.editGroupId
        && <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 2 }}>
          <SmallButton icon="link" text={Locale.label("eventCalendar.subscribe")} onClick={(e: React.MouseEvent) => { e.preventDefault(); handleSubscribe(); }} toolTip={Locale.label("eventCalendar.subscribeTip")} data-testid="event-subscribe-button" />
          <SmallButton icon="event_note" text={Locale.label("eventCalendar.addEvent")} onClick={() => { handleAddEvent({ start: new Date(), end: new Date() }); }} data-testid="event-add-button" />
        </Stack>
      }
      {allTags.length > 0 && (
        <Stack direction="row" spacing={0.5} sx={{ marginBottom: 1, flexWrap: "wrap", gap: 0.5 }}>
          {allTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant={selectedTags.includes(tag) ? "filled" : "outlined"}
              color={selectedTags.includes(tag) ? "primary" : "default"}
              onClick={() => toggleTag(tag)}
            />
          ))}
          {selectedTags.length > 0 && (
            <Chip label={Locale.label("eventCalendar.clear")} size="small" variant="outlined" onDelete={() => setSelectedTags([])} onClick={() => setSelectedTags([])} />
          )}
        </Stack>
      )}
      <Calendar localizer={localizer} events={expandedEvents} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} onSelectSlot={handleAddEvent} selectable={props.editGroupId !== null} date={date} view={view} onNavigate={onNavigate} onView={onView} />
      {editEvent && props.editGroupId && <EditEventModal event={editEvent} onDone={handleDone} />}
      {displayEvent && <DisplayEventModal event={displayEvent} onDone={handleDone} canEdit={props.editGroupId !== ""} onEdit={() => { setEditEvent(displayEvent); setDisplayEvent(null); }} />}
      <Snackbar open={open} onClose={() => setOpen(false)} autoHideDuration={2000} message={Locale.label("eventCalendar.copiedToClipboard")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} ContentProps={{ sx: { background: "green" } }} />
    </div>
  );
}
