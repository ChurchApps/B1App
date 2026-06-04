"use client";

import React from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";

interface Props {
  open: boolean;
  groupId: string;
  groupName?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export const RequestToJoinDialog: React.FC<Props> = ({ open, groupId, groupName, onClose, onSubmitted }) => {
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await ApiHelper.post("/groupjoinrequests", { groupId, message: message.trim() || undefined }, "MembershipApi");
      setMessage("");
      onSubmitted();
    } catch (e: any) {
      setError(e?.message || Locale.label("mobile.group.failedToSubmitRequest"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" data-testid="request-to-join-dialog">
      <DialogTitle>{groupName ? Locale.label("mobile.group.requestToJoinNamed").replace("{}", groupName) : Locale.label("mobile.group.requestToJoin")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          {Locale.label("mobile.group.requestNote")}
        </Typography>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          label={Locale.label("mobile.group.messageOptional")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 1000 } }}
          data-testid="request-message-input"
        />
        {error && (
          <Typography color="error" sx={{ mt: 1 }} data-testid="request-error">
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setMessage(""); setError(null); onClose(); }} disabled={submitting}>
          {Locale.label("mobile.group.cancel")}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting} data-testid="request-submit">
          {Locale.label("mobile.group.sendRequest")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
