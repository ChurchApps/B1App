"use client";

import React from "react";
import { Container } from "@mui/material";
import { CuratedCalendar } from "@churchapps/apphelper/website";

interface Props { churchId: string; calendarId: string; firstDayOfWeek: number; }

// No eventUrl: with it the calendar sends the window to /events/{id}, which is not an embed route and would
// blank the frame. Without it an event opens in the calendar's own dialog.
export function EmbedCalendar({ churchId, calendarId, firstDayOfWeek }: Props) {
  // The month grid depends on the visitor's time zone; render it in the browser only.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  return <Container data-testid="embed-calendar">{mounted && <CuratedCalendar churchId={churchId} curatedCalendarId={calendarId} mode="view" firstDayOfWeek={firstDayOfWeek} />}</Container>;
}
