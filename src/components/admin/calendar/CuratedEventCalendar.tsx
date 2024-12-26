import { useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { Button, Icon, Stack } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import { saveAs } from "file-saver";
import { EventHelper, CuratedEventWithEventInterface, ApiHelper } from "@churchapps/apphelper";
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

  const handleSubscribe = () => {
    ApiHelper.get("/events/subscribe?curatedCalendarId=" + props.curatedCalendarId, "ContentApi").then((result) => {
      if (result.error) {
        alert("Error while converting the file!");
      } else {
        const blob = new Blob([result.value], { type: "text/plain;charset=utf-8" });
        saveAs(blob, "curated_calendar.ics");
      }
    })
  }

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
        <Button startIcon={<Icon>description</Icon>} title="Download an ICS file which can be uploaded to the Google Calendar" size="small" variant="contained" onClick={(e) => { e.preventDefault(); handleSubscribe(); }}>Subscribe</Button>
        {props.mode === "edit" && <Button endIcon={<EventNoteIcon />} size="small" variant="contained" onClick={() => { setOpen(true); }}>Add</Button>}
      </Stack>
      <Calendar localizer={localizer} events={expandedEvents} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} />
      {open && props.mode === "edit" && <EditCalendarEventModal onDone={handleDone} churchId={props.churchId} curatedCalendarId={props.curatedCalendarId} />}
      {displayCalendarEvent && <DisplayCalendarEventModal event={displayCalendarEvent} curatedCalendarId={props.curatedCalendarId} mode={props.mode} onDone={handleDone} />}
    </div>
  );
}
