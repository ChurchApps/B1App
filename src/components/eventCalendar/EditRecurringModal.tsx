import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import { useState } from "react";

interface Props {
  action: string;
  onDone?: (editType:string) => void;
}

export function EditRecurringModal(props: Props) {
  const [editType, setEditType] = useState("this");

  return (
    <Dialog open={true} onClose={props.onDone}>
      <DialogTitle>{(props.action === "delete") ? "Delete" : "Edit"} Recurring Event</DialogTitle>
      <DialogContent>
        <RadioGroup defaultValue="this" onChange={(e) => { setEditType(e.target.value); }}>
          <FormControlLabel value="this" control={<Radio />} label="Just this date" data-testid="edit-recurring-this-radio" />
          <FormControlLabel value="future" control={<Radio />} label="This and all following dates" data-testid="edit-recurring-future-radio" />
          <FormControlLabel value="all" control={<Radio />} label="All dates" data-testid="edit-recurring-all-radio" />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { props.onDone("none"); }} data-testid="edit-recurring-cancel-button">Cancel</Button>
        <Button onClick={() => { props.onDone(editType); }} color="primary" data-testid="edit-recurring-save-button">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
