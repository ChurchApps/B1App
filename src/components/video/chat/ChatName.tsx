import React from "react";
import { UserInterface } from "../../../helpers";
import { Button, TextField } from "@mui/material";

interface Props {
  user: UserInterface,
  updateFunction: (displayName: string) => void,
  promptName: boolean
}

export const ChatName: React.FC<Props> = (props) => {
  const [edit, setEdit] = React.useState(false);
  const [displayName, setDisplayName] = React.useState("");

  const editMode = (e: React.MouseEvent) => {
    e.preventDefault();
    setEdit(true);
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value;
    switch (e.currentTarget.name) {
      case "displayName":
        setDisplayName(val);
        break;
      default:
        break;
    }
  }

  const handleUpdate = (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      alert("Please enter a full name");
      return;
    }
    props.updateFunction(trimmedName);
    setEdit(false);
  }

  React.useEffect(() => { setEdit(props.promptName); }, [props.promptName]);

  if (!edit) return (<a href="about:blank" className="nav-link" onClick={editMode}>Change Name</a>);
  else return (
    <>
      <TextField size="small" fullWidth label="Name" id="nameText2" name="displayName" type="text" placeholder="John Smith" value={displayName} onChange={handleChange}
        InputProps={{ endAdornment: <Button size="small" variant="contained" id="setNameButton" onClick={handleUpdate}>Update</Button> }}
      />
    </>
  );
}

