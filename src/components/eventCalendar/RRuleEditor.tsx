import "react-big-calendar/lib/css/react-big-calendar.css";
import React, { ChangeEvent, useEffect, useState } from "react";
import { Button, ButtonGroup, FormControl, Grid, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { RRule, Weekday, rrulestr } from "rrule";
import { EventHelper } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";

interface Props {
  start: Date;
  rRule: string;
  onChange: (rRuleString:string) => void;
}

export function RRuleEditor(props: Props) {
  const initialOptions = (props.rRule?.length > 0) ? rrulestr(props.rRule).options : new RRule({ dtstart: props.start }).options;
  initialOptions.dtstart = props.start;
  initialOptions.byhour = undefined;
  initialOptions.byminute = undefined;
  initialOptions.bysecond = undefined;
  const [rRuleOptions, setRRuleOptions] = useState(initialOptions);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const options = { ...rRuleOptions };

    switch (e.target.name) {
      case "freq":
        options.freq = parseInt(e.target.value);
        if (options.freq === RRule.WEEKLY || options.freq === RRule.DAILY) {
          options.bymonthday = [];
          options.bynweekday = [];
          options.byweekday = [];
          let startDay = props.start.getDay() - 1;
          if (startDay === -1) startDay = 6;
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
  };

  const handleWeekDayClick = (value:Weekday) => {
    const options = { ...rRuleOptions };
    if (!options.byweekday) options.byweekday = [];
    const selected = rRuleOptions.byweekday?.includes(value.weekday);
    if (!selected) options.byweekday.push(value.weekday);
    else options.byweekday = options.byweekday.filter((x: number | Weekday) => x !== value.weekday);
    setRRuleOptions(options);
  };

  const getDayButton = (value:Weekday, label:string) => {
    const selected = rRuleOptions.byweekday?.includes(value.weekday);
    return <Button key={value.toString()} variant={selected ? "contained" : "outlined"} onClick={() => { handleWeekDayClick(value); }} data-testid={`weekday-${label.toLowerCase()}-button`} aria-label={Locale.label("eventCalendar.recurring.toggleWeekday").replace("{}", value.toString())}>{label}</Button>;
  };

  const handleMonthOptionChange = (mode:string, monthDay:number, nthWeekday:number, weekday:number) => {
    const options = { ...rRuleOptions };
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
  };

  const getFreqFollowUp = () => {
    let result:React.ReactElement = <></>;
    switch (rRuleOptions.freq.toString()) {
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
        const daysOfWeek = [
          Locale.label("eventCalendar.recurring.day.sunday"),
          Locale.label("eventCalendar.recurring.day.monday"),
          Locale.label("eventCalendar.recurring.day.tuesday"),
          Locale.label("eventCalendar.recurring.day.wednesday"),
          Locale.label("eventCalendar.recurring.day.thursday"),
          Locale.label("eventCalendar.recurring.day.friday"),
          Locale.label("eventCalendar.recurring.day.saturday")
        ];
        const ordinals = [
          Locale.label("eventCalendar.recurring.ordinal.first"),
          Locale.label("eventCalendar.recurring.ordinal.second"),
          Locale.label("eventCalendar.recurring.ordinal.third"),
          Locale.label("eventCalendar.recurring.ordinal.fourth"),
          Locale.label("eventCalendar.recurring.ordinal.last")
        ];
        const dayOfMonth = props.start.getDate() || 1;
        const dayOfWeek = props.start.getDay() || 0;
        const ordinal = Math.floor((dayOfMonth - 1) / 7);
        result = (<>
          <InputLabel>{Locale.label("eventCalendar.recurring.on")}</InputLabel>
          <Select name="on" value={(rRuleOptions.bymonthday?.length > 0) ? "monthDay" : "nthWeekday"} onChange={(e) => { handleMonthOptionChange(e.target.value, dayOfMonth, ordinal, dayOfWeek); }} label={Locale.label("eventCalendar.recurring.on")} data-testid="monthly-option-select" aria-label={Locale.label("eventCalendar.recurring.monthlyOptionAria")}>
            <MenuItem value="monthDay">{Locale.label("eventCalendar.recurring.monthlyOnDay").replace("{}", dayOfMonth.toString())}</MenuItem>
            <MenuItem value="nthWeekday">{Locale.label("eventCalendar.recurring.monthlyOnNth").replace("{ordinal}", ordinals[ordinal]).replace("{day}", daysOfWeek[dayOfWeek])}</MenuItem>
          </Select>
        </>);
        break;
    }
    return result;
  };

  const handleEndsChange = (e:SelectChangeEvent) => {
    const options = { ...rRuleOptions };
    switch (e.target.value) {
      case "never": options.count = undefined; options.until = undefined; break;
      case "count": options.count = 1; options.until = undefined; break;
      case "until": options.count = undefined; options.until = new Date(); break;
    }
    setRRuleOptions(options);
  };

  const handleEndFollowupChange = (e:ChangeEvent<HTMLInputElement>) => {
    const options = { ...rRuleOptions };
    switch (e.target.name) {
      case "until": options.until = DateHelper.toDate(e.target.value); break;
      case "count": options.count = parseInt(e.target.value); break;
    }
    setRRuleOptions(options);
  };

  const ends = (rRuleOptions.count) ? "count" : (rRuleOptions.until) ? "until" : "never";

  const getEndsFollowUp = () => {
    let result:React.ReactElement = <></>;
    switch (ends) {
      case "until":
        result = (<TextField name="until" type="date" value={DateHelper.formatHtml5Date(rRuleOptions.until)} fullWidth label={Locale.label("eventCalendar.recurring.endDate")} onChange={handleEndFollowupChange} size="small" data-testid="recurrence-end-date-input" aria-label={Locale.label("eventCalendar.recurring.endDateAria")} />);
        break;
      case "count":
        result = (<TextField name="count" type="number" value={rRuleOptions.count} fullWidth label={Locale.label("eventCalendar.recurring.occurrences")} onChange={handleEndFollowupChange} size="small" data-testid="recurrence-count-input" aria-label={Locale.label("eventCalendar.recurring.occurrencesAria")} />);
        break;
    }
    return result;
  };

  useEffect(() => {
    const result = EventHelper.getPartialRRuleString(rRuleOptions);
    props.onChange(result);
  }, [rRuleOptions, props.onChange]);

  return (
    <>
      <Grid size={{ xs: 2 }}>
        <TextField name="interval" type="number" value={rRuleOptions.interval} fullWidth label={Locale.label("eventCalendar.recurring.interval")} onChange={handleChange} size="small" data-testid="recurrence-interval-input" aria-label={Locale.label("eventCalendar.recurring.intervalAria")} />
      </Grid>
      <Grid size={{ xs: 5 }}>
        <FormControl fullWidth size="small">
          <InputLabel>{Locale.label("eventCalendar.recurring.frequency")}</InputLabel>
          <Select name="freq" value={rRuleOptions.freq.toString()} onChange={handleChange} label={Locale.label("eventCalendar.recurring.frequency")} data-testid="recurrence-frequency-select" aria-label={Locale.label("eventCalendar.recurring.frequencyAria")}>
            <MenuItem value={RRule.DAILY.toString()}>{Locale.label("eventCalendar.recurring.freqDay")}</MenuItem>
            <MenuItem value={RRule.WEEKLY.toString()}>{Locale.label("eventCalendar.recurring.freqWeek")}</MenuItem>
            <MenuItem value={RRule.MONTHLY.toString()}>{Locale.label("eventCalendar.recurring.freqMonth")}</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 5 }}>
        <FormControl fullWidth size="small">
          {getFreqFollowUp()}
        </FormControl>
      </Grid>
      <Grid size={{ xs: 3 }}>
        <FormControl fullWidth size="small">
          <InputLabel>{Locale.label("eventCalendar.recurring.ends")}</InputLabel>
          <Select name="ends" value={ends} onChange={handleEndsChange} label={Locale.label("eventCalendar.recurring.frequency")} data-testid="recurrence-ends-select" aria-label={Locale.label("eventCalendar.recurring.endsAria")}>
            <MenuItem value="never">{Locale.label("eventCalendar.recurring.never")}</MenuItem>
            <MenuItem value="until">{Locale.label("eventCalendar.recurring.endsOn")}</MenuItem>
            <MenuItem value="count">{Locale.label("eventCalendar.recurring.endsAfter")}</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 9 }}>
        {getEndsFollowUp()}
      </Grid>

    </>
  );
}
