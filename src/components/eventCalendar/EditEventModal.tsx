import "react-big-calendar/lib/css/react-big-calendar.css";
import { EventInterface } from "@/helpers";
import { Dialog, DialogContent, Grid, TextField } from "@mui/material";
import { InputBox } from "..";

interface Props {
  event: EventInterface;
  onDone?: () => void;
}

export function EditEventModal(props: Props) {

  const handleSave = () => {
    props.onDone();
  }

  return (
    <Dialog open={true} onClose={props.onDone}>
      <DialogContent>
        <br />
        <InputBox saveFunction={handleSave} headerText="Edit Event">
          <br />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField name="title" value={props.event.title} fullWidth label="Title" />
            </Grid>
            <Grid item xs={12}>
              <TextField name="description" value={props.event.description} multiline fullWidth label="Description" />
            </Grid>
          </Grid>
        </InputBox>
      </DialogContent>
    </Dialog>
  );
}
