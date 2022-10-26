import { Alert, Snackbar } from "@mui/material";
import React, { useEffect } from "react";

interface Props { errors: string[] }

export const ErrorMessages: React.FC<Props> = props => {
  const [open, setOpen] = React.useState(false);
  let [items, setItems] = React.useState([]);

  useEffect(() => {
    if (props.errors.length > 0) {
      let _items = [];
      for (let i = 0; i < props.errors.length; i++) {
        _items.push(<div key={i}>{props.errors[i]}</div>);
      }
      setItems(_items);
      setOpen(true);
    }
  }, [props.errors]);

  let result = (<Snackbar open={open} anchorOrigin={{ horizontal: "center", vertical: "bottom" }} autoHideDuration={6000} onClose={() => setOpen(false)}>
    <Alert variant="filled" severity="error">{items}</Alert>
  </Snackbar>);

  return result;
}
