import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css";
import { EventInterface } from "@/helpers";
import { useState } from "react";
import { EditEventModal } from "./EditEventModal";
import { EventDetailsModel } from "./EventDetailsModel";

interface Props {
  events: EventInterface[];
  editGroupId?: string;
  onRequestRefresh?: () => void;
}

export function EventCalendar(props:Props) {
  const localizer = momentLocalizer(moment)
  const [editEvent, setEditEvent] = useState<EventInterface | null>(null);

  const handleAddEvent = (slotInfo: any) => {
    setEditEvent({ start: slotInfo.start, end: slotInfo.end, allDay:true, groupId: props.editGroupId, visibility: "public" })
  }

  const handleEventClick = (event: EventInterface) => {
    const ev = { ...event };
    let tz = new Date().getTimezoneOffset();
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    ev.start.setMinutes(ev.start.getMinutes() - tz);
    ev.end.setMinutes(ev.end.getMinutes() - tz);
    setEditEvent(ev);
  }

  const handleDone = () => {
    setEditEvent(null);
    if (props.onRequestRefresh) props.onRequestRefresh();
  }

  return (
    <div>
      <Calendar localizer={localizer} events={props.events} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} onSelectSlot={handleAddEvent} selectable={props.editGroupId !== null} />
      {editEvent && props.editGroupId && <EditEventModal event={editEvent} onDone={ handleDone } />}
      {editEvent && !props.editGroupId && <EventDetailsModel event={editEvent} onDone={ handleDone } />}
    </div>
  );
}
