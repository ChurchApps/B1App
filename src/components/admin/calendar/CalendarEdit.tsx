"use client";
import { useState, useEffect } from "react";
import { ErrorMessages, InputBox, ApiHelper, CuratedCalendarInterface, UserHelper, Permissions } from "@churchapps/apphelper";
import { SelectChangeEvent, TextField } from "@mui/material";

type Props = {
  calendar: CuratedCalendarInterface;
  updatedCallback: (calendar: CuratedCalendarInterface) => void;
};

export function CalendarEdit(props: Props) {
  const [calendar, setCalendar] = useState<CuratedCalendarInterface>(null);
  const [errors, setErrors] = useState([]);

  const handleCancel = () => props.updatedCallback(calendar);
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    let b = { ...calendar };
    const val = e.target.value;
    switch (e.target.name) {
      case "name": b.name = val; break;
    }
    setCalendar(b);
  };

  const validate = () => {
    let errors = [];
    if (calendar.name === "") errors.push("Please enter a name.");
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to create calendars")
    setErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/curatedCalendars", [calendar], "ContentApi").then((data) => {
        setCalendar(data);
        props.updatedCallback(data);
      });
    }
  };

  const handleDelete = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.content.edit)) errors.push("Unauthorized to delete calendars");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    if (window.confirm("Are you sure you wish to permanently delete this calendar?")) {
      ApiHelper.delete("/curatedCalendars/" + calendar.id.toString(), "ContentApi").then(() => props.updatedCallback(null));
    }
  };

  useEffect(() => { setCalendar(props.calendar); }, [props.calendar]);

  if (!calendar) return <></>
  else return (
    <>
      <InputBox id="calendarDetailsBox" headerText="Edit Calendar" headerIcon="school" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={handleDelete} data-testid="calendar-edit-box">
        <ErrorMessages errors={errors} data-testid="calendar-errors" />
        <TextField fullWidth label="Name" name="name" value={calendar.name} onChange={handleChange} onKeyDown={handleKeyDown} data-testid="calendar-name-input" aria-label="Calendar name" />
      </InputBox>
    </>
  );
}
