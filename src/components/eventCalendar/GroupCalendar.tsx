import "react-big-calendar/lib/css/react-big-calendar.css";
import { EventInterface } from "@/helpers";
import { EventCalendar } from "./EventCalendar";

interface Props {
  groupId: string;
  canEdit: boolean;
}

export function GroupCalendar(props: Props) {

  const events:EventInterface[] = [
    {
      id: "abcdefg",
      title: "Music Camp",
      allDay: true,
      start: new Date(2023, 2, 27),
      end: new Date(2023, 3, 1),
      description: "All ages are welcome"
    }, {
      id: "hijklmn",
      title: "Music Camp Performance",
      start: new Date(2023, 2, 31, 12, 0, 0),
      end: new Date(2023, 2, 31, 13, 0, 0),
      description: "Doors open 30 minutes before show"
    }
  ]

  return (
    <EventCalendar events={events} editGroupId={(props.canEdit) ? props.groupId : "" } />
  );
}
