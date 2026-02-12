"use client";

import { GroupInterface } from "@churchapps/helpers";
import { ApiHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { Modal, Box, FormControl, InputLabel, MenuItem, Select, TextField, SelectChangeEvent, Button, DialogActions, Alert, Snackbar } from "@mui/material";
import React from "react";
import { useEffect, useState } from "react";
import { Loading } from "@churchapps/apphelper";

type Props = {
  contentDisplayName: string;
  contentType: string;
  contentId: string;
  onClose: () => void;
};

export function B1ShareModal(props: Props) {
  const [groupId, setGroupId] = useState("");
  const [groups, setGroups] = useState<GroupInterface[]>(null);
  const [comment, setComment] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const loadData = async () => {
    const g = await ApiHelper.get("/groups/my", "MembershipApi");
    if (g.length > 0) setGroupId(g[0].id);
    setGroups(g);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    e.preventDefault();
    switch (e.target.name) {
      case "group": setGroupId(e.target.value as string); break;
      case "comment": setComment(e.target.value as string); break;
    }
  };

  const handlePost = () => {
    setShowSuccess(true);
    if (groupId === "") alert(Locale.label("b1Share.validate.selectGroup"));
    else if (comment === "") alert(Locale.label("b1Share.validate.addComment"));
    else {
      const payload = {
        groupId: groupId,
        contentType: props.contentType,
        contentId: props.contentId,
        comment: comment,
        title: props.contentDisplayName
      };
      ApiHelper.post("/conversations/start", payload, "MessagingApi").then(() => {
        setShowSuccess(true);
      });
    }
  };

  useEffect(() => { loadData(); }, []);

  const style = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24
  };

  const getModalContent = () => {
    if (!ApiHelper.isAuthenticated) return <p>{Locale.label("b1Share.validate.loginFirst")}</p>;
    else if (!groups) return (<Loading />);
    else if (groups.length === 0) return (<p>{Locale.label("b1Share.validate.notMember")}</p>);
    else {
      return (<>
        <h2>{Locale.label("b1Share.sharingToGroup").replace("{}", props.contentDisplayName)}</h2>
        <FormControl fullWidth>
          <InputLabel>{Locale.label("b1Share.group")}</InputLabel>
          <Select label={Locale.label("b1Share.group")} name="group" value={groupId} onChange={handleChange} data-testid="share-group-select">
            {groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField fullWidth multiline label={Locale.label("b1Share.comment")} name="comment" value={comment} onChange={handleChange} rows={3} placeholder={Locale.label("b1Share.commentPlaceholder")} data-testid="share-comment-input" />
      </>);
    }
  };


  if (showSuccess) {
    return (<Snackbar open={true} anchorOrigin={{ horizontal: "center", vertical: "bottom" }} autoHideDuration={2500} onClose={() => props.onClose()}>
      <Alert variant="filled" severity="success">{Locale.label("b1Share.contentShared")}</Alert>
    </Snackbar>);
  } else {
    return (<Modal open={true} onClose={props.onClose}>
      <Box sx={style}>
        <div style={{ paddingLeft: 16, paddingRight: 16 }}>
          {getModalContent()}
        </div>
        <DialogActions sx={{ paddingX: "16px", paddingBottom: "12px" }}>
          <Button variant="outlined" onClick={props.onClose} data-testid="share-close-button">Close</Button>
          <Button variant="contained" onClick={handlePost} data-testid="share-post-button">Post</Button>
        </DialogActions>
      </Box>

    </Modal>);
  }

}

