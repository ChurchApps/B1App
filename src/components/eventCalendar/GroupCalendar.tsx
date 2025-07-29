import "react-big-calendar/lib/css/react-big-calendar.css";
import { ApiHelper } from "@churchapps/apphelper";
import type { EventInterface } from "@churchapps/helpers";
import { EventCalendar } from "./EventCalendar";
import { useEffect, useState } from "react";

interface Props {
  churchId: string;
  groupId: string;
  canEdit: boolean;
}

export function GroupCalendar(props: Props) {
  const [events, setEvents] = useState<EventInterface[]>([]);

  const loadData = () => {
    if (ApiHelper.isAuthenticated) ApiHelper.get("/events/group/" + props.groupId, "ContentApi").then((data: any) => { setEvents(data); });
    else ApiHelper.getAnonymous("/events/public/group/" + props.churchId + "/" + props.groupId, "ContentApi").then((data: any) => { setEvents(data); });
  }

  useEffect(loadData, [props.groupId]);

  return (
    <EventCalendar events={events} editGroupId={(props.canEdit && ApiHelper.isAuthenticated) ? props.groupId : "" } onRequestRefresh={loadData} />
  );
}
