import React from "react";
import { ApiHelper } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/apphelper";
import { InputBox } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import type { BlockoutDateInterface } from "@churchapps/helpers";
import { Alert, TextField } from "@mui/material";
import { useForm } from "react-hook-form";

interface Props {
  blockoutDate: BlockoutDateInterface;
  onUpdate: () => void;
}

type AnyRecord = Record<string, any>;

export const BlockoutDateEdit: React.FC<Props> = (props) => {
  const { register, handleSubmit, formState } = useForm<AnyRecord>({
    defaultValues: {
      startDate: DateHelper.formatHtml5Date(props.blockoutDate.startDate),
      endDate: DateHelper.formatHtml5Date(props.blockoutDate.endDate)
    }
  });

  const e = formState.errors as any;
  const summaryErrors: string[] = [];
  if (e.startDate?.message) summaryErrors.push(e.startDate.message);
  if (e.endDate?.message) summaryErrors.push(e.endDate.message);

  const handleDelete = () => {
    ApiHelper.delete("/blockoutDates/" + props.blockoutDate.id, "DoingApi").then(() => {
      props.onUpdate();
    });
  };

  const onValid = (values: AnyRecord) => {
    const bd: BlockoutDateInterface = {
      ...props.blockoutDate,
      startDate: DateHelper.toDate(values.startDate),
      endDate: DateHelper.toDate(values.endDate)
    };
    ApiHelper.post("/blockoutDates", [bd], "DoingApi").then(() => {
      props.onUpdate();
    });
  };

  return (
    <InputBox headerIcon="block" headerText={Locale.label("plans.blockoutDates.title")} saveFunction={handleSubmit(onValid)} cancelFunction={props.onUpdate} deleteFunction={props.blockoutDate.id && handleDelete}>
      {summaryErrors.length > 0 && <Alert severity="error" sx={{ mb: 2 }}>{summaryErrors.map((msg) => <div key={msg}>{msg}</div>)}</Alert>}
      <TextField fullWidth label={Locale.label("plans.blockoutDate.startDate")} name="startDate" type="date" data-cy="start-date" data-testid="blockout-start-date-input" error={!!e.startDate} helperText={e.startDate?.message} InputLabelProps={{ shrink: true }} {...register("startDate", { required: Locale.label("plans.blockoutDate.startRequired"), validate: (val, all) => !all.endDate || !val || val <= all.endDate || Locale.label("plans.blockoutDate.startBeforeEnd") })} />
      <TextField fullWidth label={Locale.label("plans.blockoutDate.endDate")} name="endDate" type="date" data-cy="end-date" data-testid="blockout-end-date-input" error={!!e.endDate} helperText={e.endDate?.message} InputLabelProps={{ shrink: true }} {...register("endDate", { required: Locale.label("plans.blockoutDate.endRequired") })} />
    </InputBox>
  );
};
