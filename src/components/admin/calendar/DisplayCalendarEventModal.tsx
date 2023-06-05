import { Dialog, DialogContent, DialogActions, Typography, Box, Button } from "@mui/material";
import { DateHelper, EventInterface, ApiHelper } from "@/helpers";

interface Props {
  event: EventInterface;
  curatedCalendarId?: string;
  handleDone?: () => void;
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
        props.handleDone();
      })
    }
  }

  return (
    <Dialog open={true} onClose={props.handleDone} fullWidth scroll="body">
      <DialogContent>
        <Box borderLeft={5} borderRadius={1} borderColor="#1976d2" padding={2} paddingBottom={0}>
          <Typography variant="h5" fontWeight={550} marginBottom={1}>{props.event.title}</Typography>
          <i>{getDisplayTime()}</i>
          <Typography marginTop={2}>{props.event?.description}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={props.handleDone}>Cancel</Button>
        <Button variant="contained" onClick={handleDelete}>Delete</Button>
      </DialogActions>
    </Dialog>
  );
}
