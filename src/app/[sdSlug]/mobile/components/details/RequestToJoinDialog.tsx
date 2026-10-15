"use client";

import React from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { ApiHelper, Locale } from "@churchapps/apphelper";
import { mobileTheme } from "../mobileTheme";
import { Sheet } from "../kit";

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

  const handleCancel = () => { setMessage(""); setError(null); onClose(); };

  return (
    <Sheet
      open={open}
      onClose={handleCancel}
      title={groupName ? Locale.label("mobile.group.requestToJoinNamed").replace("{}", groupName) : Locale.label("mobile.group.requestToJoin")}
      actions={(
        <>
          <Button variant="outlined" onClick={handleCancel} disabled={submitting}>{Locale.label("mobile.group.cancel")}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting} data-testid="request-submit">{Locale.label("mobile.group.sendRequest")}</Button>
        </>
      )}
    >
      <Box data-testid="request-to-join-dialog">
        <Typography sx={{ mb: 2, fontSize: 15, color: mobileTheme.colors.textSecondary }}>{Locale.label("mobile.group.requestNote")}</Typography>
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
        {error && <Typography sx={{ mt: 1, color: mobileTheme.colors.error }} data-testid="request-error">{error}</Typography>}
      </Box>
    </Sheet>
  );
};
