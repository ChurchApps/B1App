import React, { useState } from "react";
import { Button, TextField, IconButton, Paper, Stack, Typography, Tooltip } from "@mui/material";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import CloseIcon from "@mui/icons-material/Close";
import { StreamChatManager } from "@/helpers/StreamChatManager";
import { ChatUserInterface } from "@/helpers";

interface Props { user: ChatUserInterface }

export const EmbeddedChatName: React.FC<Props> = (props) => {
  const [edit, setEdit] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState("");
  const { firstName, lastName } = props.user;
  const currentUserName = `${firstName} ${lastName}`;

  const handleUpdate = (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      alert("Please enter a full name");
      return;
    }
    StreamChatManager.handleNameUpdate(trimmedName);
    setEdit(false);
  };

  if (edit)
    return (
      <TextField
        size="small"
        fullWidth
        label="Name"
        name="displayName"
        placeholder="John Smith"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        sx={{ marginTop: 0, marginBottom: "4px" }}
        InputProps={{
          endAdornment: (
            <>
              <Button size="small" variant="contained" onClick={handleUpdate}>update</Button>
              <IconButton color="error" size="small" onClick={() => { setEdit(false); setDisplayName(""); }}><CloseIcon fontSize="small" /></IconButton>
            </>
          ),
        }}
      />
    );
  else
    return (
      <>
        {currentUserName.trim() === "" || currentUserName === "Anonymous " ? (
          <Button fullWidth size="small" startIcon={<DriveFileRenameOutlineIcon fontSize="small" />} onClick={() => setEdit(true)} sx={{ borderRadius: 0, height: "25px" }}>
            Change Name
          </Button>
        ) : (
          <Paper elevation={0} sx={{ padding: "1px 10px" }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography fontSize={14} color={"#1976d2"}>{currentUserName}</Typography>
              <Tooltip title="Update Name" arrow placement="left">
                <IconButton size="small" color="primary" onClick={() => { setEdit(true); setDisplayName(currentUserName); }}>
                    <DriveFileRenameOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>
        )}
      </>
    );
};
