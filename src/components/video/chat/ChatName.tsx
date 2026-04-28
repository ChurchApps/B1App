import React from "react";
import type { UserInterface } from "@churchapps/helpers";
import { Button, TextField } from "@mui/material";
import { Locale } from "@churchapps/apphelper";

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
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.currentTarget.value;
    switch (e.currentTarget.name) {
      case "displayName": setDisplayName(val); break;
      default: break;
    }
  };

  const handleUpdate = (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      alert(Locale.label("video.chat.enterFullName"));
      return;
    }
    props.updateFunction(trimmedName);
    setEdit(false);
  };

  React.useEffect(() => { setEdit(props.promptName); }, [props.promptName]);

  if (!edit) return (<a href="about:blank" className="nav-link" onClick={editMode} data-testid="edit-name-button">{Locale.label("video.chat.changeName")}</a>);
  else {
    return (
      <>
        <TextField size="small" fullWidth label={Locale.label("person.name")} id="nameText2" name="displayName" type="text" placeholder={Locale.label("video.chat.namePlaceholder")} value={displayName} onChange={handleChange}
          InputProps={{ endAdornment: <Button size="small" variant="contained" id="setNameButton" onClick={handleUpdate} data-testid="chat-name-update-button">{Locale.label("common.update")}</Button> }}
          data-testid="chat-name-input"
        />
      </>
    );
  }
};

