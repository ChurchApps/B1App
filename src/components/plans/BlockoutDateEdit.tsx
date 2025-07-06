import React from "react";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { DateHelper } from "@churchapps/apphelper/dist/helpers/DateHelper";
import { ErrorMessages } from "@churchapps/apphelper/dist/components/ErrorMessages";
import { InputBox } from "@churchapps/apphelper/dist/components/InputBox";
import type { BlockoutDateInterface } from "@churchapps/apphelper/dist/helpers/Interfaces";
import { TextField } from "@mui/material";

interface Props {
  blockoutDate: BlockoutDateInterface;
  onUpdate: () => void;
}

export const BlockoutDateEdit: React.FC<Props> = (props) => {
  const [blockoutDate, setBlockoutDate] = React.useState<BlockoutDateInterface>(props.blockoutDate);
  const [errors, setErrors] = React.useState<string[]>([]);

  const validate = () => {
    const result: string[] = [];
    if (!blockoutDate.startDate) result.push("Start date is required.");
    if (!blockoutDate.endDate) result.push("End date is required.");
    if (blockoutDate.startDate && blockoutDate.endDate && blockoutDate.startDate > blockoutDate.endDate) result.push("Start date must be before end date.");
    setErrors(result);
    return result.length === 0;
  }

  const handleSave = () => {
    if (validate()) {
      ApiHelper.post("/blockoutDates", [blockoutDate], "DoingApi").then(() => {
        props.onUpdate();
      });
    }
  }

  const handleDelete = () => {
    ApiHelper.delete("/blockoutDates/" + blockoutDate.id, "DoingApi").then(() => {
      props.onUpdate();
    });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bd = {...blockoutDate};
    switch (e.target.name) {
      case "startDate": bd.startDate = new Date(e.target.value); break;
      case "endDate": bd.endDate = new Date(e.target.value); break;
    }
    setBlockoutDate(bd);
  }

  return (<InputBox headerIcon="block" headerText="Blockout Dates" saveFunction={handleSave} cancelFunction={props.onUpdate} deleteFunction={blockoutDate.id && handleDelete}>
    <TextField fullWidth label="Start Date" name="startDate" type="date" data-cy="start-date" value={DateHelper.formatHtml5Date(blockoutDate.startDate)} onChange={handleChange} />
    <TextField fullWidth label="End Date" name="endDate" type="date" data-cy="end-date" value={DateHelper.formatHtml5Date(blockoutDate.endDate)} onChange={handleChange} />
    <ErrorMessages errors={errors} />
  </InputBox>);
}

