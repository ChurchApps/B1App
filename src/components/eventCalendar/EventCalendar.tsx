import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css";
import { EventInterface } from "@/helpers";
import { useState } from "react";
import { EditEventModal } from "./EditEventModal";
import { EventHelper } from "@/appBase/helpers/EventHelper";
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

  const handleAddEvent = (slotInfo: any) => {
    const startTime = new Date(slotInfo.start);
    startTime.setHours(12);
    const endTime = new Date(slotInfo.start);
    endTime.setHours(13);
    setEditEvent({ start: startTime, end: endTime, allDay:false, groupId: props.editGroupId, visibility: "public" })
  }

  const handleEventClick = (event: EventInterface) => {
    const ev = { ...event };
    let tz = new Date().getTimezoneOffset();
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    ev.start.setMinutes(ev.start.getMinutes() - tz);
    ev.end.setMinutes(ev.end.getMinutes() - tz);
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
      <Calendar localizer={localizer} events={expandedEvents} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} onSelectSlot={handleAddEvent} selectable={props.editGroupId !== null} />
      {editEvent && props.editGroupId && <EditEventModal event={editEvent} onDone={ handleDone } />}
      {displayEvent && <DisplayEventModal event={displayEvent} onDone={ handleDone } canEdit={props.editGroupId!==""} onEdit={() => { setEditEvent(displayEvent); setDisplayEvent(null); }} />}
    </div>
  );
}
