import { useState, useEffect } from "react";
import { ApiHelper, CuratedEventWithEventInterface } from "@/helpers";
import { CuratedEventCalendar } from "./CuratedEventCalendar";

interface Props {
  curatedCalendarId: string;
  churchId: string;
  canEdit: boolean;
  updatedCallback?: () => void;
  refresh?: any;
}

export function CuratedCalendar(props: Props) {
  const [events, setEvents] = useState<CuratedEventWithEventInterface[]>([]);

  const loadData = () => {
    if (ApiHelper.isAuthenticated) ApiHelper.get("/curatedEvents/calendar/" + props.curatedCalendarId, "ContentApi").then((data) => { setEvents(data); if (props.updatedCallback) props.updatedCallback(); });
    else ApiHelper.getAnonymous("/curatedEvents/public/calendar/" + props.churchId + "/" + props.curatedCalendarId, "ContentApi").then((data) => { setEvents(data); });
  };

  useEffect(loadData, [props.curatedCalendarId, props?.refresh]);

  return (
    <CuratedEventCalendar events={events} editCuratedCalendarId={(props.canEdit && ApiHelper.isAuthenticated) ? props.curatedCalendarId : ""} churchId={(props.canEdit && ApiHelper.isAuthenticated) ? props.churchId : ""} onRequestRefresh={loadData} />
  );
}
