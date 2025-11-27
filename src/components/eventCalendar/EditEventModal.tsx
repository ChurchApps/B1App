"use client";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ApiHelper } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/apphelper";
import { MarkdownEditor } from "@churchapps/apphelper-markdown";
import { ErrorMessages } from "@churchapps/apphelper";
import { EventHelper } from "@churchapps/apphelper";
import type { EventExceptionInterface, EventInterface } from "@churchapps/helpers";
import { AppBar, Button, Checkbox, Dialog, DialogContent, FormControlLabel, FormGroup, Grid, Icon, IconButton, TextField, Toolbar, Typography, Switch, Stack } from "@mui/material";
import { useState } from "react";
import { RRuleEditor } from "./RRuleEditor";
import { EditRecurringModal } from "./EditRecurringModal";

interface Props {
  event: EventInterface;
  onDone?: () => void;
}

export function EditEventModal(props: Props) {
  const [event, setEvent] = useState(props.event);
  const [rRule, setRRule] = useState(event.recurrenceRule);
  const [recurrenceModalType, setRecurrenceModalType] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleRecurringDelete = (editType:string) => {
    switch (editType){
      case "this":
        const exception: EventExceptionInterface = { eventId: event.id, exceptionDate: event.start };
        ApiHelper.post("/eventExceptions", [exception], "ContentApi").then(() => { props.onDone(); });
        break;
      case "future":
        const ev = {...event};
        const rrule = EventHelper.getFullRRule(ev);
        rrule.options.until = new Date(ev.start);
        ev.start = props.event.start; //Keep the original start date, not this instance's start date
        event.recurrenceRule = EventHelper.getPartialRRuleString(rrule.options);
        ApiHelper.post("/events", [event], "ContentApi").then(() => { props.onDone(); });
        break;
      case "all":
        ApiHelper.delete("/events/" + event.id, "ContentApi").then(() => { props.onDone(); });
        break;
    }
    setRecurrenceModalType("");
  }

  const handleRecurringSave = async (editType:string) => {
    switch (editType){
      case "this":
        const exception: EventExceptionInterface = { eventId: event.id, exceptionDate: event.start };
        ApiHelper.post("/eventExceptions", [exception], "ContentApi").then(() => {
          const oneEv = {...event};
          oneEv.id=null;
          oneEv.recurrenceRule = null;
          ApiHelper.post("/events", [oneEv], "ContentApi").then(() => { props.onDone(); });
        });
        break;
      case "future":
        const newEvent = {...event};
        newEvent.id = null;
        newEvent.recurrenceRule = rRule;

        const originalEv = await ApiHelper.get("/events/" + props.event.id, "ContentApi");
        const rrule = EventHelper.getFullRRule(originalEv);
        rrule.options.until = new Date(newEvent.start);
        EventHelper.cleanRule(rrule.options);
        originalEv.recurrenceRule = EventHelper.getPartialRRuleString(rrule.options);
        ApiHelper.post("/events", [originalEv, newEvent], "ContentApi").then(() => { props.onDone(); });
        break;
      case "all":
        const allEv = {...event};
        allEv.recurrenceRule = rRule;
        ApiHelper.post("/events", [allEv], "ContentApi").then(() => { props.onDone(); });
        break;
    }
    setRecurrenceModalType("");
  }

  const handleDelete = () => {
    if (props.event.recurrenceRule) setRecurrenceModalType("delete");
    else if (confirm("Are you sure you wish to delete this event?")) ApiHelper.delete("/events/" + event.id, "ContentApi").then(() => { props.onDone(); });
  }

  const handleSave = () => {
    if (props.event.recurrenceRule) setRecurrenceModalType("save");
    else {
      let errors: string[] = [];
      const ev = {...event};

      if (!ev.title || ev.title === "") errors.push("Please enter a title");

      if (errors.length > 0) {
        setErrors(errors);
        return;
      }

      ev.recurrenceRule = rRule;
      ApiHelper.post("/events", [ev], "ContentApi").then((data: EventInterface[]) => {
        props.onDone();
      });
    }
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
      <Grid size={{ xs: 6 }}>
        <TextField name="start" type="date" value={(event.start) ? DateHelper.formatHtml5Date(DateHelper.toDate(event.start)) : ""} fullWidth label="Start Time" onChange={handleChange} size="small" data-testid="event-start-date-input" aria-label="Event start date" />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField name="end" type="date" value={(event.end) ? DateHelper.formatHtml5Date(DateHelper.toDate(event.end)) : ""} fullWidth label="End Time" onChange={handleChange} size="small" data-testid="event-end-date-input" aria-label="Event end date" />
      </Grid>
    </>);
    else return (<>
      <Grid size={{ xs: 6 }}>
        <TextField name="start" type="datetime-local" value={DateHelper.formatHtml5DateTime(event.start)} fullWidth label="Start Time" onChange={handleChange} size="small" data-testid="event-start-datetime-input" aria-label="Event start date and time" />
      </Grid>
      <Grid size={{ xs: 6 }}>
        <TextField name="end" type="datetime-local" value={DateHelper.formatHtml5DateTime(event.end)} fullWidth label="End Time" onChange={handleChange} size="small" data-testid="event-end-datetime-input" aria-label="Event end date and time" />
      </Grid>
    </>);

  }

  const handleToggleRecurring = (checked:boolean) => {
    const recurrenceRule = (checked) ? "FREQ=DAILY;INTERVAL=1" : "";
    setEvent({...event, recurrenceRule});
    setRRule(recurrenceRule);
  }

  return (
    <>
      <ErrorMessages errors={errors} data-testid="event-errors" />
      <Dialog open={true} onClose={props.onDone} fullScreen>
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={props.onDone} aria-label="close" data-testid="close-event-modal-button">
              <Icon>close</Icon>
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Edit Event
            </Typography>
            <Button autoFocus color="inherit" onClick={handleDelete} data-testid="delete-event-button" aria-label="Delete event">
              Delete
            </Button>
            <Button autoFocus color="inherit" onClick={handleSave} data-testid="save-event-button" aria-label="Save event">
              Save
            </Button>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <Grid container spacing={1}>
            <Grid size={{ xs: 6 }}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={event.allDay} data-testid="all-day-checkbox" />}  label="All Day" name="allDay" onChange={(e, checked) => { setEvent({...event, allDay:checked}); }} data-testid="all-day-form-control" aria-label="Mark event as all day" />
              </FormGroup>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormGroup>
                <FormControlLabel control={<Checkbox checked={event.recurrenceRule?.length>0} data-testid="recurring-checkbox" />}  label="Recurring" name="recurring" onChange={(e, checked) => { handleToggleRecurring(checked); }} data-testid="recurring-form-control" aria-label="Mark event as recurring" />
              </FormGroup>
            </Grid>
            {getDates()}

            {(event?.recurrenceRule?.length>0) && <RRuleEditor start={event.start} rRule={event.recurrenceRule || ""} onChange={(rRule:string) => { setRRule(rRule); }} /> }

            <Grid size={{ xs: 12 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography>Private: </Typography>
                <Switch
                  size="small"
                  checked={event.visibility === "private"}
                  onChange={(e) => {
                    if (e.target.checked === true) setEvent({...event, visibility: "private"});
                    else setEvent({...event, visibility: "public"});
                  }}
                  data-testid="event-privacy-switch"
                  aria-label="Toggle event privacy"
                />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField name="title" value={event.title} fullWidth label="Title" onChange={handleChange} size="small" data-testid="event-title-input" aria-label="Event title" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <MarkdownEditor value={event.description || ""} onChange={val => setEvent({...event, description: val})} style={{ maxHeight: 200, overflowY: "scroll" }} data-testid="event-description-editor" />
            </Grid>
          </Grid>

        </DialogContent>
      </Dialog>
      {recurrenceModalType && <EditRecurringModal action={recurrenceModalType} onDone={(editType) => { (recurrenceModalType==="delete") ? handleRecurringDelete(editType) : handleRecurringSave(editType) }} /> }
    </>
  );
}
