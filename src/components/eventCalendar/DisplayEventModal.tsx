"use client";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { DateHelper } from "@churchapps/apphelper/dist/helpers/DateHelper";
import { Conversations } from "../notes/Conversations";
import { MarkdownPreviewLight } from "@churchapps/apphelper/dist/components/markdownEditor/MarkdownPreviewLight";
import type { EventInterface } from "@churchapps/helpers";
import { AppBar, Button, Dialog, DialogContent, Icon, IconButton, Toolbar, Typography } from "@mui/material";
import { useContext } from "react";
import UserContext from "@/context/UserContext";

interface Props {
  event: EventInterface;
  canEdit?: boolean;
  onDone?: () => void;
  onEdit?: () => void;
}

export function DisplayEventModal(props: Props) {

  const context = useContext(UserContext);

  const getDisplayTime = () => {
    let result = "";
    if (props.event.allDay) {
      const prettyStartDate = DateHelper.prettyDate(props.event.start)
      const prettyEndDate = DateHelper.prettyDate(props.event.end)
      if (prettyStartDate===prettyEndDate) result = prettyStartDate;
      else result = `${prettyStartDate} - ${prettyEndDate}`;
    } else {
      const prettyStart = DateHelper.prettyDateTime(props.event.start)
      const prettyEnd = DateHelper.prettyDateTime(props.event.end)
      const prettyEndTime = DateHelper.prettyTime(props.event.end);
      const startDate = DateHelper.prettyDate(new Date(prettyStart))
      const endDate = DateHelper.prettyDate(new Date(prettyEnd))
      if (startDate === endDate) result = `${prettyStart} - ${prettyEndTime}`
      else result = `${prettyStart} - ${prettyEnd}`;
    }
    return result;
  }

  return (
    <>
      <Dialog open={true} onClose={props.onDone} fullScreen>
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={props.onDone} aria-label="close">
              <Icon>close</Icon>
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Edit Event
            </Typography>
            <Button autoFocus color="inherit" onClick={props.onEdit} data-testid="event-edit-button">
              Edit
            </Button>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <h1>{props.event.title}</h1>
          <i>{getDisplayTime()}</i>
          <MarkdownPreviewLight value={props.event.description || ""} />
          <h2>Discussion</h2>
          <Conversations context={context} contentType="event" contentId={props.event.id} groupId={props.event.groupId} />

        </DialogContent>
      </Dialog>

    </>
  );
}
