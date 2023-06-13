import "react-big-calendar/lib/css/react-big-calendar.css";
import { Dialog, DialogContent, DialogActions, Typography, Box, Button } from "@mui/material";
import { DateHelper, CuratedEventWithEventInterface, ApiHelper } from "@/helpers";

interface Props {
  event: CuratedEventWithEventInterface;
  curatedCalendarId?: string;
  onDone?: () => void;
}

export function DisplayCalendarEventModal(props: Props) {
  const getDisplayTime = () => {
    let result = "";
    if (props.event.allDay) {
      const prettyStartDate = DateHelper.prettyDate(props.event.start);
      const prettyEndDate = DateHelper.prettyDate(props.event.end);
      if (prettyStartDate === prettyEndDate) result = prettyStartDate;
      else result = `${prettyStartDate} - ${prettyEndDate}`;
    } else {
      const prettyStart = DateHelper.prettyDateTime(props.event.start);
      const prettyEnd = DateHelper.prettyDateTime(props.event.end);
      const prettyEndTime = DateHelper.prettyTime(props.event.end);
      const startDate = DateHelper.prettyDate(new Date(prettyStart));
      const endDate = DateHelper.prettyDate(new Date(prettyEnd));
      if (startDate === endDate) result = `${prettyStart} - ${prettyEndTime}`;
      else result = `${prettyStart} - ${prettyEnd}`;
    }
    return result;
  };

  const handleDelete = () => {
    if (confirm("Are you sure you wish to delete this event?")) {
      ApiHelper.delete("/curatedEvents/calendar/" + props.curatedCalendarId + "/event/" + props.event.id, "ContentApi").then(() => {
        props.onDone();
      })
    }
  }

  return (
    <Dialog open={true} onClose={props.onDone} fullWidth scroll="body">
      <DialogContent>
        <Box borderLeft={5} borderRadius={1} borderColor="#1976d2" padding={2} paddingBottom={0}>
          <Typography variant="h5" fontWeight={550} marginBottom={1}>{props.event.title}</Typography>
          <i>{getDisplayTime()}</i>
          <Typography marginTop={2}>{props.event?.description}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={props.onDone}>Cancel</Button>
        {props.event.eventId && <Button variant="contained" onClick={handleDelete}>Delete</Button>}
      </DialogActions>
    </Dialog>
  );
}
