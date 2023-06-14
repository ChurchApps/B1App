import { useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { Button } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import { EventHelper } from "@/appBase/helpers/EventHelper";
import { CuratedEventWithEventInterface } from "@/helpers";
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

  const localizer = momentLocalizer(moment);

  const handleEventClick = (event: CuratedEventWithEventInterface) => {
    const ev = { ...event };
    let tz = new Date().getTimezoneOffset();
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    ev.start.setMinutes(ev.start.getMinutes() - tz);
    ev.end.setMinutes(ev.end.getMinutes() - tz);
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
        const diff =
          new Date(evt.end).getTime() - new Date(evt.start).getTime();
        evt.start = date;
        evt.end = new Date(date.getTime() + diff);
        expandedEvents.push(evt);
      });
    } else expandedEvents.push(ev);
  });

  return (
    <div>
      {props.mode === "edit" &&
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 17 }}>
          <div></div>
          <Button endIcon={<EventNoteIcon />} size="small" variant="contained" onClick={() => { setOpen(true); }}>Add</Button>
        </div>
      }
      <Calendar localizer={localizer} events={expandedEvents} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} />
      {open && props.mode === "edit" && <EditCalendarEventModal onDone={handleDone} churchId={props.churchId} curatedCalendarId={props.curatedCalendarId} />}
      {displayCalendarEvent && <DisplayCalendarEventModal event={displayCalendarEvent} curatedCalendarId={props.curatedCalendarId} mode={props.mode} onDone={handleDone} />}
    </div>
  );
}
