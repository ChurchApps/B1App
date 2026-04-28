import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { useState } from "react";

interface Props {
  action: string;
  onDone?: (editType:string) => void;
}

export function EditRecurringModal(props: Props) {
  const [editType, setEditType] = useState("this");

  return (
    <Dialog open={true} onClose={props.onDone}>
      <DialogTitle>{(props.action === "delete") ? Locale.label("eventCalendar.recurring.deleteTitle") : Locale.label("eventCalendar.recurring.editTitle")}</DialogTitle>
      <DialogContent>
        <RadioGroup defaultValue="this" onChange={(e) => { setEditType(e.target.value); }}>
          <FormControlLabel value="this" control={<Radio />} label={Locale.label("eventCalendar.recurring.justThisDate")} data-testid="edit-recurring-this-radio" />
          <FormControlLabel value="future" control={<Radio />} label={Locale.label("eventCalendar.recurring.thisAndFollowing")} data-testid="edit-recurring-future-radio" />
          <FormControlLabel value="all" control={<Radio />} label={Locale.label("eventCalendar.recurring.allDates")} data-testid="edit-recurring-all-radio" />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { props.onDone("none"); }} data-testid="edit-recurring-cancel-button">{Locale.label("common.cancel")}</Button>
        <Button onClick={() => { props.onDone(editType); }} color="primary" data-testid="edit-recurring-save-button">{Locale.label("common.save")}</Button>
      </DialogActions>
    </Dialog>
  );
}
