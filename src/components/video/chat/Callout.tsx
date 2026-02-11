import { ChatConfigHelper } from "@/helpers/ChatConfigHelper";
import { ChatHelper } from "@/helpers/ChatHelper";
import { Button, FormControl, Icon, InputLabel, OutlinedInput } from "@mui/material";
import React from "react";
import { ChatRoomInterface, ChatUserInterface } from "../../../helpers";
import { ApiHelper } from "@churchapps/apphelper";
import type { MessageInterface } from "@churchapps/helpers";

interface Props { room: ChatRoomInterface, user: ChatUserInterface }

export const Callout: React.FC<Props> = (props) => {

  const [edit, setEdit] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const editMode = (e: React.MouseEvent) => { e.preventDefault(); setEdit(true); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setMessage(e.currentTarget.value); };

  const handleUpdate = (e: React.MouseEvent) => {
    e.preventDefault();
    const { firstName, lastName } = ChatHelper.current.user;
    const msg: MessageInterface = { churchId: ChatConfigHelper.current.churchId, content: message, conversationId: props.room.conversation.id, displayName: `${firstName} ${lastName}`, messageType: "callout" };
    ApiHelper.post("/messages/setCallout", msg, "MessagingApi");
    setEdit(false);
  };

  const getEditSection = () => (<FormControl fullWidth variant="outlined">
    <InputLabel htmlFor="calloutText">Callout Message</InputLabel>
    <OutlinedInput id="calloutText" name="calloutText" type="text" label="Callout Message" value={message} onChange={handleChange} autoComplete="off" data-testid="callout-message-input"
      endAdornment={<>
        <Button variant="contained" onClick={handleUpdate} data-testid="callout-update-button">Update</Button>
      </>}
    />
  </FormControl>);

  if (props.user?.isHost) {
    if (edit) return getEditSection();
    else {
      if (props.room.callout?.content === "") return <div id="callout"><a href="about:blank" onClick={editMode} data-testid="callout-set-link">Set Callout</a></div>;
      else return (<div id="callout"><span style={{ float: "right" }}><a href="about:blank" onClick={editMode}><Icon>edit</Icon></a></span>{ChatHelper.insertLinks(props.room.callout?.content || "")}</div>);
    }
  } else {
    if (props.room.callout?.content === "") return null;
    else return (<div id="callout">{ChatHelper.insertLinks(props.room.callout.content)}</div>);
  }
};

