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
}

export function EventCalendar(props:Props) {
  const localizer = momentLocalizer(moment)
  const [editEvent, setEditEvent] = useState<EventInterface | null>(null);

  const handleAddEvent = (slotInfo: any) => {
    console.log("handleAddEvent");
    alert("You clicked on " + slotInfo.start.toLocaleString() + " - " + slotInfo.end.toLocaleString());
  }

  const handleEventClick = (event: EventInterface) => {
    setEditEvent(event);
  }

  return (
    <div>
      <Calendar localizer={localizer} events={props.events} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} onSelectSlot={handleAddEvent} selectable={props.editGroupId !== null} />
      {editEvent && props.editGroupId && <EditEventModal event={editEvent} onDone={ () => setEditEvent(null) } />}
      {editEvent && !props.editGroupId && <EventDetailsModel event={editEvent} onDone={() => setEditEvent(null) } />}
    </div>
  );
}
