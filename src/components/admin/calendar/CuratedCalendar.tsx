import { useState, useEffect } from "react";
import { ApiHelper } from "@churchapps/apphelper";
import type { CuratedEventWithEventInterface } from "@churchapps/helpers";
import { CuratedEventCalendar } from "./CuratedEventCalendar";

interface Props {
  curatedCalendarId: string;
  churchId: string;
  mode: "view" | "edit";
  updatedCallback?: () => void;
  refresh?: any;
}

export function CuratedCalendar(props: Props) {
  const [events, setEvents] = useState<CuratedEventWithEventInterface[]>([]);

  const loadData = () => {
    if (ApiHelper.isAuthenticated) ApiHelper.get("/curatedEvents/calendar/" + props.curatedCalendarId, "ContentApi").then((data: any) => { setEvents(data); if (props.updatedCallback) props.updatedCallback(); });
    else ApiHelper.getAnonymous("/curatedEvents/public/calendar/" + props.churchId + "/" + props.curatedCalendarId, "ContentApi").then((data: any) => { setEvents(data); });
  };

  useEffect(loadData, [props.curatedCalendarId, props?.refresh]);

  return (
    <CuratedEventCalendar events={events} curatedCalendarId={props.curatedCalendarId} churchId={props.churchId} onRequestRefresh={loadData} mode={props.mode} />
  );
}
