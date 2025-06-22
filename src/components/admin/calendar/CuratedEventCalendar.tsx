import { useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { Button, Icon, Snackbar, Stack } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import { EventHelper, CuratedEventWithEventInterface, CommonEnvironmentHelper, UserHelper } from "@churchapps/apphelper";
import { EditCalendarEventModal } from "./EditCalendarEventModal";
import { DisplayCalendarEventModal } from "./DisplayCalendarEventModal";

interface Props {
  events: CuratedEventWithEventInterface[];
  mode: "view" | "edit";
  curatedCalendarId?: string;
  churchId?: string;
  onRequestRefresh?: () => void;
}

export function CuratedEventCalendar(props: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const [displayCalendarEvent, setDisplayCalendarEvent] = useState<CuratedEventWithEventInterface | null>(null);
  const [ShowCopy, setShowCopy] = useState<boolean>(false);

  const localizer = momentLocalizer(moment);

  const handleSubscribe = () => {
    setShowCopy(true);
    navigator.clipboard.writeText(`${CommonEnvironmentHelper.ContentApi}/events/subscribe?curatedCalendarId=${props.curatedCalendarId}&churchId=${UserHelper.currentUserChurch.church.id}`);
  }

  const handleEventClick = (event: CuratedEventWithEventInterface) => {
    const ev = { ...event };
    // let tz = new Date().getTimezoneOffset();
    // ev.start = new Date(ev.start);
    // ev.end = new Date(ev.end);
    // ev.start.setMinutes(ev.start.getMinutes() - tz);
    // ev.end.setMinutes(ev.end.getMinutes() - tz);
    setDisplayCalendarEvent(ev);
  };

  const handleDone = () => {
    setOpen(false);
    setDisplayCalendarEvent(null);
    if (props.onRequestRefresh) props.onRequestRefresh();
  };

  const expandedEvents: CuratedEventWithEventInterface[] = [];
  const startRange = new Date();
  const endRange = new Date();
  startRange.setFullYear(startRange.getFullYear() - 1);
  endRange.setFullYear(endRange.getFullYear() + 1);

  props.events.forEach((event) => {
    const ev = { ...event };
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    if (ev.recurrenceRule) {
      const dates = EventHelper.getRange(ev, startRange, endRange);
      dates.forEach((date) => {
        const evt = { ...event };
        const diff
          = new Date(evt.end).getTime() - new Date(evt.start).getTime();
        evt.start = date;
        evt.end = new Date(date.getTime() + diff);
        expandedEvents.push(evt);
      });
    } else expandedEvents.push(ev);
  });

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={"17px"} marginTop={"12px"}>
        <Button startIcon={<Icon>link</Icon>} title="Copy the URL and add this to your Google Calendar (or other)" size="small" variant="contained" onClick={(e) => { e.preventDefault(); handleSubscribe(); }} data-testid="calendar-subscribe-button">Subscribe</Button>
        {props.mode === "edit" && <Button endIcon={<EventNoteIcon />} size="small" variant="contained" onClick={() => { setOpen(true); }} data-testid="calendar-add-event-button">Add</Button>}
      </Stack>
      <Calendar localizer={localizer} events={expandedEvents} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} />
      {open && props.mode === "edit" && <EditCalendarEventModal onDone={handleDone} churchId={props.churchId} curatedCalendarId={props.curatedCalendarId} />}
      {displayCalendarEvent && <DisplayCalendarEventModal event={displayCalendarEvent} curatedCalendarId={props.curatedCalendarId} mode={props.mode} onDone={handleDone} />}
      <Snackbar open={ShowCopy} onClose={() => setShowCopy(false)} autoHideDuration={2000} message={"Copied to clipboard!"} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} ContentProps={{ sx: { background: "green" } }} />
    </div>
  );
}
