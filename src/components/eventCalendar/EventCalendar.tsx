import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Snackbar, Stack } from "@mui/material";
import { EventHelper } from "@churchapps/apphelper/dist/helpers/EventHelper";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import { CommonEnvironmentHelper } from "@churchapps/apphelper/dist/helpers/CommonEnvironmentHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import type { EventInterface } from "@churchapps/helpers";
import { useState } from "react";
import { EditEventModal } from "./EditEventModal";
import { DisplayEventModal } from "./DisplayEventModal";

interface Props {
  events: EventInterface[];
  editGroupId?: string;
  onRequestRefresh?: () => void;
}

export function EventCalendar(props:Props) {
  const localizer = momentLocalizer(moment)
  const [editEvent, setEditEvent] = useState<EventInterface | null>(null);
  const [displayEvent, setDisplayEvent] = useState<EventInterface | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const handleSubscribe = () => {
    setOpen(true);
    navigator.clipboard.writeText(`${CommonEnvironmentHelper.ContentApi}/events/subscribe?groupId=${props.editGroupId}&churchId=${UserHelper.currentUserChurch.church.id}`);
  }

  const handleAddEvent = (slotInfo: any) => {
    const startTime = new Date(slotInfo.start);
    startTime.setHours(12);
    startTime.setMinutes(0);
    startTime.setSeconds(0);
    const endTime = new Date(slotInfo.start);
    endTime.setHours(13);
    endTime.setMinutes(0);
    endTime.setSeconds(0);
    setEditEvent({ start: startTime, end: endTime, allDay:false, groupId: props.editGroupId, visibility: "public" })
  }

  const handleEventClick = (event: EventInterface) => {
    const ev = { ...event };
    // let tz = new Date().getTimezoneOffset();
    // ev.start = new Date(ev.start);
    // ev.end = new Date(ev.end);
    // ev.start.setMinutes(ev.start.getMinutes() - tz);
    // ev.end.setMinutes(ev.end.getMinutes() - tz);
    setDisplayEvent(ev);
    //setEditEvent(ev);
  }

  const handleDone = () => {
    setDisplayEvent(null);
    setEditEvent(null);
    if (props.onRequestRefresh) props.onRequestRefresh();
  }

  const expandedEvents:EventInterface[] = [];
  const startRange = new Date();
  const endRange = new Date();
  startRange.setFullYear(startRange.getFullYear() - 1);
  endRange.setFullYear(endRange.getFullYear() + 1);

  props.events.forEach((event) => {
    const ev = {...event};
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    if (event.recurrenceRule) {
      const dates = EventHelper.getRange(event, startRange, endRange);
      dates.forEach((date) => {
        const ev = { ...event };
        const diff = new Date(ev.end).getTime() - new Date(ev.start).getTime();
        ev.start = date;
        ev.end = new Date(date.getTime() + diff);
        expandedEvents.push(ev);
      });
      EventHelper.removeExcludeDates(expandedEvents);
    }
    else expandedEvents.push(ev);
  });

  return (
    <div>
      {props.editGroupId
        && <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: 2 }}>
          <SmallButton icon="link" text="Subscribe" onClick={(e: React.MouseEvent) => { e.preventDefault(); handleSubscribe() }} toolTip="Copy the URL and add this to your Google Calendar (or other)" />
          <SmallButton icon="event_note" text="Add Event" onClick={() => { handleAddEvent({ start:new Date(), end: new Date() }) }} />
        </Stack>
      }
      <Calendar localizer={localizer} events={expandedEvents} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} onSelectSlot={handleAddEvent} selectable={props.editGroupId !== null} />
      {editEvent && props.editGroupId && <EditEventModal event={editEvent} onDone={ handleDone } />}
      {displayEvent && <DisplayEventModal event={displayEvent} onDone={ handleDone } canEdit={props.editGroupId!==""} onEdit={() => { setEditEvent(displayEvent); setDisplayEvent(null); }} />}
      <Snackbar open={open} onClose={() => setOpen(false)} autoHideDuration={2000} message={"Copied to clipboard!"} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} ContentProps={{ sx: { background: "green" } }} />
    </div>
  );
}
