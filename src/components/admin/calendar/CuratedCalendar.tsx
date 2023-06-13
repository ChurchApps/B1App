import { useState, useEffect } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ApiHelper, CuratedEventWithEventInterface } from "@/helpers";
import { CuratedEventCalendar } from "./CuratedEventCalendar";

interface Props {
  curatedCalendarId: string;
  churchId: string;
  updatedCallback?: () => void;
  refresh?: any;
}

export function CuratedCalendar(props: Props) {
  const [events, setEvents] = useState<CuratedEventWithEventInterface[]>([]);

  const loadData = () => {
    ApiHelper.get("/curatedEvents/calendar/" + props.curatedCalendarId, "ContentApi").then((data: CuratedEventWithEventInterface[]) => { setEvents(data); });
    if (props.updatedCallback) props.updatedCallback();
  };

  useEffect(loadData, [props.curatedCalendarId, props?.refresh]);

  return (
    <CuratedEventCalendar events={events} curatedCalendarId={props.curatedCalendarId} churchId={props.churchId} onRequestRefresh={loadData} />
  );
}
