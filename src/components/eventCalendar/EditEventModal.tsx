import "react-big-calendar/lib/css/react-big-calendar.css";
import { ApiHelper, DateHelper, EventInterface } from "@/helpers";
import { Checkbox, Dialog, DialogContent, FormControlLabel, FormGroup, Grid, TextField } from "@mui/material";
import { InputBox, MarkdownEditor } from "..";
import { useState } from "react";

interface Props {
  event: EventInterface;
  onDone?: () => void;
}

export function EditEventModal(props: Props) {
  const [event, setEvent] = useState(props.event);

  const handleSave = () => {
    ApiHelper.post("/events", [event], "ContentApi").then(data => {
      props.onDone();
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const env = {...event};
    switch (e.target.name) {
      case "title": env.title = e.target.value; break;
      case "start": env.start =  DateHelper.toDate(e.target.value); break;
      case "end": env.end = DateHelper.toDate(e.target.value); break;
    }
    setEvent(env);
  }

  const getDates = () => {
    if (event.allDay) return (<>
      <Grid item xs={6}>
        <TextField name="start" type="date" value={(event.start) ? DateHelper.formatHtml5Date(DateHelper.toDate(event.start)) : ""} fullWidth label="Start Time" onChange={handleChange} />
      </Grid>
      <Grid item xs={6}>
        <TextField name="end" type="date" value={(event.end) ? DateHelper.formatHtml5Date(DateHelper.toDate(event.end)) : ""} fullWidth label="End Time" onChange={handleChange} />
      </Grid>
    </>);
    else return (<>
      <Grid item xs={6}>
        <TextField name="start" type="datetime-local" value={DateHelper.formatHtml5DateTime(event.start)} fullWidth label="Start Time" onChange={handleChange} />
      </Grid>
      <Grid item xs={6}>
        <TextField name="end" type="datetime-local" value={DateHelper.formatHtml5DateTime(event.end)} fullWidth label="End Time" onChange={handleChange} />
      </Grid>
    </>);

  }

  return (
    <Dialog open={true} onClose={props.onDone}>
      <DialogContent>
        <br />
        <InputBox saveFunction={handleSave} headerText="Edit Event">
          <br />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel control={<Checkbox defaultChecked />} label="All Day" name="allDay" onChange={(e, checked) => { setEvent({...event, allDay:checked}); }} />
              </FormGroup>
            </Grid>
            {getDates()}
            <Grid item xs={12}>
              <TextField name="title" value={event.title} fullWidth label="Title" onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <MarkdownEditor value={event.description || ""} onChange={val => setEvent({...event, description: val})} style={{ maxHeight: 200, overflowY: "scroll" }} />
            </Grid>
          </Grid>
        </InputBox>
      </DialogContent>
    </Dialog>
  );
}
