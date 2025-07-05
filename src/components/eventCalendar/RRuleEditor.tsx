import "react-big-calendar/lib/css/react-big-calendar.css";
import React, { ChangeEvent, useEffect, useState } from "react";
import { Button, ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import {RRule, Weekday, rrulestr} from "rrule";
import { EventHelper, DateHelper } from "@churchapps/apphelper";

interface Props {
  start: Date;
  rRule: string;
  onChange: (rRuleString:string) => void;
}

export function RRuleEditor(props: Props) {
  const initialOptions = (props.rRule?.length>0) ? rrulestr(props.rRule).options : new RRule({dtstart: props.start}).options;
  initialOptions.dtstart = props.start;
  initialOptions.byhour = undefined;
  initialOptions.byminute = undefined;
  initialOptions.bysecond = undefined;
  const [rRuleOptions, setRRuleOptions] = useState(initialOptions);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const options = {...rRuleOptions};

    switch (e.target.name) {
      case "freq":
        options.freq = parseInt(e.target.value);
        if (options.freq === RRule.WEEKLY || options.freq === RRule.DAILY) {
          options.bymonthday = [];
          options.bynweekday = [];
          options.byweekday = [];
          let startDay = props.start.getDay() - 1;
          if (startDay===-1) startDay=6;
          options.byweekday = [startDay];
        } else if (options.freq === RRule.MONTHLY) {
          options.bymonthday = [props.start.getDate() || 1];
          options.bynweekday = [];
          options.byweekday = [];
        }
        break;
      case "interval": options.interval = parseInt(e.target.value); break;
      case "count": options.count = parseInt(e.target.value); break;
      case "until": options.until = DateHelper.toDate(e.target.value); break;
      case "byweekday": options.byweekday = [parseInt(e.target.value)]; break;
    }
    setRRuleOptions(options);
    return;
  }

  const handleWeekDayClick = (value:Weekday) => {
    const options = {...rRuleOptions};
    if (!options.byweekday) options.byweekday=[];
    let selected = rRuleOptions.byweekday?.includes(value.weekday);
    if (!selected) options.byweekday.push(value.weekday);
    else options.byweekday = options.byweekday.filter(x => x !== value.weekday);
    setRRuleOptions(options);
  }

  const getDayButton = (value:Weekday, label:string) => {
    let selected = rRuleOptions.byweekday?.includes(value.weekday);
    return <Button key={value.toString()} variant={selected ? "contained" : "outlined"} onClick={() => { handleWeekDayClick(value) }} data-testid={`weekday-${label.toLowerCase()}-button`} aria-label={`Toggle ${value.toString()} for weekly recurrence`}>{label}</Button>
  }

  const handleMonthOptionChange = (mode:string, monthDay:number, nthWeekday:number, weekday:number) => {
    const options = {...rRuleOptions};
    switch (mode) {
      case "monthDay":
        options.bymonthday = [monthDay];
        options.bynweekday = [];
        break;
      case "nthWeekday":
        options.bymonthday = [];
        options.byweekday = [weekday === 0 ? 6 : weekday - 1]; //to handle (MO, TU, WE..) day of the week
        options.bysetpos = [nthWeekday + 1]; //to handle (first, second, third..) nth day of the week
        break;
    }
    setRRuleOptions(options);
  }

  const getFreqFollowUp = () => {
    let result:React.ReactElement = <></>;
    switch(rRuleOptions.freq.toString())
    {
      case RRule.WEEKLY.toString():
        result = (<>
          <ButtonGroup size="small">
            {getDayButton(RRule.SU, "S")}
            {getDayButton(RRule.MO, "M")}
            {getDayButton(RRule.TU, "T")}
            {getDayButton(RRule.WE, "W")}
            {getDayButton(RRule.TH, "T")}
            {getDayButton(RRule.FR, "F")}
            {getDayButton(RRule.SA, "S")}
          </ButtonGroup>
        </>);
        break;
      case RRule.MONTHLY.toString():
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const ordinals = ["first", "second", "third", "fourth", "last"];
        const dayOfMonth = props.start.getDate() || 1;
        const dayOfWeek = props.start.getDay() || 0;
        const ordinal = Math.floor((dayOfMonth - 1) / 7);
        result = (<>
          <InputLabel>On</InputLabel>
          <Select name="on" value={(rRuleOptions.bymonthday?.length>0) ? "monthDay" : "nthWeekday"} onChange={(e) => { handleMonthOptionChange(e.target.value, dayOfMonth, ordinal, dayOfWeek) }} label="On" data-testid="monthly-option-select" aria-label="Select monthly recurrence option">
            <MenuItem value="monthDay">Monthly on day {dayOfMonth}</MenuItem>
            <MenuItem value="nthWeekday">Monthly on the {ordinals[ordinal]} {daysOfWeek[dayOfWeek]}</MenuItem>
          </Select>
        </>);
        break;
    }
    return result;
  }

  const handleEndsChange = (e:SelectChangeEvent) => {
    const options = {...rRuleOptions};
    switch (e.target.value) {
      case "never":
        options.count = undefined;
        options.until = undefined;
        break;
      case "count":
        options.count = 1;
        options.until = undefined;
        break;
      case "until":
        options.count = undefined;
        options.until = new Date();
        break;
    }
    setRRuleOptions(options);
  }

  const handleEndFollowupChange = (e:ChangeEvent<HTMLInputElement>) => {
    const options = {...rRuleOptions};
    switch (e.target.name) {
      case "until": options.until =  DateHelper.toDate(e.target.value); break;
      case "count": options.count =  parseInt(e.target.value); break;
    }
    setRRuleOptions(options);
  }

  const ends = (rRuleOptions.count) ? "count" : (rRuleOptions.until) ? "until" : "never";

  const getEndsFollowUp = () => {
    let result:React.ReactElement = <></>;
    switch(ends)
    {
      case "until":
        result = (<TextField name="until" type="date" value={DateHelper.formatHtml5Date(rRuleOptions.until)} fullWidth label="End Date" onChange={handleEndFollowupChange} size="small" data-testid="recurrence-end-date-input" aria-label="Recurrence end date" />);
        break;
      case "count":
        result = (<TextField name="count" type="number" value={rRuleOptions.count} fullWidth label="Occurances" onChange={handleEndFollowupChange} size="small" data-testid="recurrence-count-input" aria-label="Number of recurrence occurrances" />);
        break;
    }
    return result;
  }

  useEffect(() => {
    const result = EventHelper.getPartialRRuleString(rRuleOptions);
    props.onChange(result);
  }, [rRuleOptions]);

  return (
    <>
      <Grid item xs={2}>
        <TextField name="interval" type="number" value={rRuleOptions.interval} fullWidth label="Interval" onChange={handleChange} size="small" data-testid="recurrence-interval-input" aria-label="Recurrence interval" />
      </Grid>
      <Grid item xs={5}>
        <FormControl fullWidth size="small">
          <InputLabel>Frequency</InputLabel>
          <Select name="freq" value={rRuleOptions.freq.toString()} onChange={handleChange} label="Frequency" data-testid="recurrence-frequency-select" aria-label="Select recurrence frequency">
            <MenuItem value={RRule.DAILY.toString()}>Day</MenuItem>
            <MenuItem value={RRule.WEEKLY.toString()}>Week</MenuItem>
            <MenuItem value={RRule.MONTHLY.toString()}>Month</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={5}>
        <FormControl fullWidth size="small">
          {getFreqFollowUp()}
        </FormControl>
      </Grid>
      <Grid item xs={3}>
        <FormControl fullWidth size="small">
          <InputLabel>Ends</InputLabel>
          <Select name="ends" value={ends} onChange={handleEndsChange} label="Frequency" data-testid="recurrence-ends-select" aria-label="Select when recurrence ends">
            <MenuItem value="never">Never</MenuItem>
            <MenuItem value="until">On</MenuItem>
            <MenuItem value="count">After</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={9}>
        {getEndsFollowUp()}
      </Grid>

    </>
  );
}
