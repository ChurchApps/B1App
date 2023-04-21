import "react-big-calendar/lib/css/react-big-calendar.css";
import { ApiHelper, DateHelper, EventInterface } from "@/helpers";
import { AppBar, Button, Checkbox, Dialog, DialogContent, FormControlLabel, FormGroup, Grid, Icon, IconButton, TextField, Toolbar, Typography } from "@mui/material";
import { MarkdownEditor } from "..";
import { useState } from "react";
import { RRuleEditor } from "./RRuleEditor";

interface Props {
  event: EventInterface;
  onDone?: () => void;
}

export function EditEventModal(props: Props) {
  const [event, setEvent] = useState(props.event);
  const [rRule, setRRule] = useState(event.recurrenceRule);

  const handleSave = () => {
    const ev = {...event};
    ev.recurrenceRule = rRule;
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
        <TextField name="start" type="date" value={(event.start) ? DateHelper.formatHtml5Date(DateHelper.toDate(event.start)) : ""} fullWidth label="Start Time" onChange={handleChange} size="small" />
      </Grid>
      <Grid item xs={6}>
        <TextField name="end" type="date" value={(event.end) ? DateHelper.formatHtml5Date(DateHelper.toDate(event.end)) : ""} fullWidth label="End Time" onChange={handleChange} size="small" />
      </Grid>
    </>);
    else return (<>
      <Grid item xs={6}>
        <TextField name="start" type="datetime-local" value={DateHelper.formatHtml5DateTime(event.start)} fullWidth label="Start Time" onChange={handleChange} size="small" />
      </Grid>
      <Grid item xs={6}>
        <TextField name="end" type="datetime-local" value={DateHelper.formatHtml5DateTime(event.end)} fullWidth label="End Time" onChange={handleChange} size="small" />
      </Grid>
    </>);

  }

  const handleToggleRecurring = (checked:boolean) => {
    const recurrenceRule = (checked) ? "FREQ=DAILY;INTERVAL=1" : "";
    setEvent({...event, recurrenceRule});
  }

  return (
    <Dialog open={true} onClose={props.onDone} fullScreen>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={props.onDone} aria-label="close">
            <Icon>close</Icon>
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Edit Event
          </Typography>
          <Button autoFocus color="inherit" onClick={handleSave}>
              Save
          </Button>
        </Toolbar>
      </AppBar>
      <DialogContent>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={event.allDay} />}  label="All Day" name="allDay" onChange={(e, checked) => { setEvent({...event, allDay:checked}); }} />
            </FormGroup>
          </Grid>
          <Grid item xs={6}>
            <FormGroup>
              <FormControlLabel control={<Checkbox checked={event.recurrenceRule?.length>0} />}  label="Recurring" name="recurring" onChange={(e, checked) => { handleToggleRecurring(checked); }} />
            </FormGroup>
          </Grid>
          {getDates()}

          {(event?.recurrenceRule?.length>0) && <RRuleEditor start={event.start} rRule={event.recurrenceRule || ""} onChange={(rRule:string) => { setRRule(rRule); }} /> }

          <Grid item xs={12}>
            <TextField name="title" value={event.title} fullWidth label="Title" onChange={handleChange} size="small" />
          </Grid>
          <Grid item xs={12}>
            <MarkdownEditor value={event.description || ""} onChange={val => setEvent({...event, description: val})} style={{ maxHeight: 200, overflowY: "scroll" }} />
          </Grid>
        </Grid>

      </DialogContent>
    </Dialog>
  );
}
