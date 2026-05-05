import React, { useState } from "react";
import { Button, TextField, IconButton, Paper, Stack, Typography, Tooltip } from "@mui/material";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import CloseIcon from "@mui/icons-material/Close";
import { StreamChatManager } from "@/helpers/StreamChatManager";
import { ChatUserInterface } from "@/helpers";
import { Locale } from "@churchapps/apphelper";

interface Props { user: ChatUserInterface }

export const EmbeddedChatName: React.FC<Props> = (props) => {
  const [edit, setEdit] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState("");
  const [user, setUser] = useState(props.user);
  const { firstName, lastName } = user;
  const currentUserName = `${firstName} ${lastName}`;

  const handleUpdate = (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      alert(Locale.label("video.chat.enterFullName"));
      return;
    }
    setUser(StreamChatManager.updateName(trimmedName));
    setEdit(false);
  };

  if (edit) {
    return (
      <TextField
        size="small"
        fullWidth
        label={Locale.label("person.name")}
        name="displayName"
        placeholder={Locale.label("video.chat.namePlaceholder")}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        data-testid="embedded-chat-name-input"
        sx={{ marginTop: 0, marginBottom: "4px" }}
        InputProps={{
          endAdornment: (
            <>
              <Button size="small" variant="contained" onClick={handleUpdate} data-testid="chat-name-update-button">{Locale.label("common.update")}</Button>
              <IconButton color="error" size="small" onClick={() => { setEdit(false); setDisplayName(""); }}><CloseIcon fontSize="small" /></IconButton>
            </>
          )
        }}
      />
    );
  } else {
    return (
      <>
        {currentUserName.trim() === "" || currentUserName === "Anonymous "
          ? (
            <Button fullWidth size="small" startIcon={<DriveFileRenameOutlineIcon fontSize="small" />} onClick={() => setEdit(true)} sx={{ borderRadius: 0, height: "25px" }} data-testid="edit-name-button">
              {Locale.label("video.chat.changeName")}
            </Button>
          )
          : (
            <Paper elevation={0} sx={{ padding: "1px 10px" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography fontSize={14} color={"#1976d2"}>{currentUserName}</Typography>
                <Tooltip title={Locale.label("video.chat.updateName")} arrow placement="left">
                  <IconButton size="small" color="primary" onClick={() => { setEdit(true); setDisplayName(currentUserName); }}>
                    <DriveFileRenameOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          )}
      </>
    );
  }
};
