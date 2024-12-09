import "react-big-calendar/lib/css/react-big-calendar.css";
import { ApiHelper, EventInterface } from "@churchapps/apphelper";
import { EventCalendar } from "./EventCalendar";
import { useEffect, useState } from "react";

interface Props {
  churchId: string;
  groupId: string;
  canEdit: boolean;
}

export function GroupCalendar(props: Props) {
  const [events, setEvents] = useState<EventInterface[]>([]);

  const updateTime = (data: any) => {
    const result: EventInterface[] = [];
    data.forEach((d: EventInterface) => {
      const ev = { ...d };
      let tz = new Date().getTimezoneOffset();
      ev.start = new Date(ev.start);
      ev.end = new Date(ev.end);
      ev.start.setMinutes(ev.start.getMinutes() - tz);
      ev.end.setMinutes(ev.end.getMinutes() - tz);
      result.push(ev);
    });
    return result;
  }

  const loadData = () => {
    if (ApiHelper.isAuthenticated) ApiHelper.get("/events/group/" + props.groupId, "ContentApi").then((data) => {
      const result = updateTime(data);
      setEvents(result);
    });
    else ApiHelper.getAnonymous("/events/public/group/" + props.churchId + "/" + props.groupId, "ContentApi").then((data) => {
      const result = updateTime(data);
      setEvents(result);
    });
  }

  useEffect(loadData, [props.groupId]);

  return (
    <EventCalendar events={events} editGroupId={(props.canEdit && ApiHelper.isAuthenticated) ? props.groupId : "" } onRequestRefresh={loadData} />
  );
}
