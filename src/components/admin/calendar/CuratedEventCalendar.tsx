import { useState } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { Button, Icon, Snackbar, Stack, Menu, MenuItem } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { EventHelper } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import type { CuratedEventWithEventInterface } from "@churchapps/helpers";
import { EditCalendarEventModal } from "./EditCalendarEventModal";
import { DisplayCalendarEventModal } from "./DisplayCalendarEventModal";
import { EnvironmentHelper } from "@/helpers";

interface Props {
  events: CuratedEventWithEventInterface[];
  mode: "view" | "edit";
  curatedCalendarId?: string;
  churchId?: string;
  onRequestRefresh?: () => void;
}

export function CuratedEventCalendar(props: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const [displayCalendarEvent, setDisplayCalendarEvent] = useState<CuratedEventWithEventInterface | null>(null);
  const [ShowCopy, setShowCopy] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const localizer = momentLocalizer(moment);

  const getIcsUrl = () => `${EnvironmentHelper.Common.ContentApi}/events/subscribe?curatedCalendarId=${props.curatedCalendarId}&churchId=${UserHelper.currentUserChurch.church.id}`;

  const handleSubscribeClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopyIcsLink = () => {
    setShowCopy(true);
    navigator.clipboard.writeText(getIcsUrl());
    handleMenuClose();
  };

  const handleDownloadIcsFile = () => {
    const url = getIcsUrl();
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    handleMenuClose();
  };

  const handleEventClick = (event: CuratedEventWithEventInterface) => {
    const ev = { ...event };
    // let tz = new Date().getTimezoneOffset();
    // ev.start = new Date(ev.start);
    // ev.end = new Date(ev.end);
    // ev.start.setMinutes(ev.start.getMinutes() - tz);
    // ev.end.setMinutes(ev.end.getMinutes() - tz);
    setDisplayCalendarEvent(ev);
  };

  const handleDone = () => {
    setOpen(false);
    setDisplayCalendarEvent(null);
    if (props.onRequestRefresh) props.onRequestRefresh();
  };

  const expandedEvents: CuratedEventWithEventInterface[] = [];
  const startRange = new Date();
  const endRange = new Date();
  startRange.setFullYear(startRange.getFullYear() - 1);
  endRange.setFullYear(endRange.getFullYear() + 1);

  props.events.forEach((event) => {
    const ev = { ...event };
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    if (ev.recurrenceRule) {
      const dates = EventHelper.getRange(ev, startRange, endRange);
      dates.forEach((date) => {
        const evt = { ...event };
        const diff
          = new Date(evt.end).getTime() - new Date(evt.start).getTime();
        evt.start = date;
        evt.end = new Date(date.getTime() + diff);
        expandedEvents.push(evt);
      });
    } else expandedEvents.push(ev);
  });

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" marginBottom={"17px"} marginTop={"12px"}>
        <div>
          <Button startIcon={<Icon>link</Icon>} endIcon={<ArrowDropDownIcon />} title="Subscribe to calendar" size="small" variant="contained" onClick={handleSubscribeClick} data-testid="calendar-subscribe-button">Subscribe</Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} data-testid="calendar-subscribe-menu">
            <MenuItem onClick={handleCopyIcsLink} data-testid="copy-ics-link-option">
              <Icon sx={{ marginRight: 1 }}>content_copy</Icon>
              Copy ICS Link
            </MenuItem>
            <MenuItem onClick={handleDownloadIcsFile} data-testid="download-ics-file-option">
              <Icon sx={{ marginRight: 1 }}>download</Icon>
              Download ICS File
            </MenuItem>
          </Menu>
        </div>
        {props.mode === "edit" && <Button endIcon={<EventNoteIcon />} size="small" variant="contained" onClick={() => { setOpen(true); }} data-testid="calendar-add-event-button">Add</Button>}
      </Stack>
      <Calendar localizer={localizer} events={expandedEvents} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} />
      {open && props.mode === "edit" && <EditCalendarEventModal onDone={handleDone} churchId={props.churchId} curatedCalendarId={props.curatedCalendarId} />}
      {displayCalendarEvent && <DisplayCalendarEventModal event={displayCalendarEvent} curatedCalendarId={props.curatedCalendarId} mode={props.mode} onDone={handleDone} />}
      <Snackbar open={ShowCopy} onClose={() => setShowCopy(false)} autoHideDuration={2000} message={"Copied to clipboard!"} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} ContentProps={{ sx: { background: "green" } }} />
    </div>
  );
}
