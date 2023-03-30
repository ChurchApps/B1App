import { Calendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css";

export function EventCalendar() {
  const localizer = momentLocalizer(moment)

  const events = [
    {
      id: "abcdefg",
      title: "Music Camp",
      allDay: true,
      start: new Date(2023, 2, 27),
      end: new Date(2023, 3, 1),
      desc: "All ages are welcome"
    }, {
      id: "hijklmn",
      title: "Music Camp Performance",
      start: new Date(2023, 2, 31, 12, 0, 0),
      end: new Date(2023, 2, 31, 13, 0, 0),
    }
  ]

  return (
      <div>
        <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" style={{ height: 500 }}
        onSelectEvent={(event) => { alert(event.id + " - " + event.desc) }}
         />
      </div>
  );
}
