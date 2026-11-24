"use client";

import React, { useEffect, useState } from "react";
import { Button, TextField, Typography } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { Sheet } from "./kit";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const ConfirmDeclineSheet = ({ open, onClose, onConfirm }: Props) => {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={Locale.label("mobile.details.declineAcceptedTitle")}
      maxWidth="xs"
      actions={<>
        <Button variant="outlined" onClick={onClose}>{Locale.label("mobile.details.cancel")}</Button>
        <Button variant="contained" color="error" data-testid="decline-confirm" onClick={() => { const r = reason.trim(); onClose(); onConfirm(r); }}>{Locale.label("mobile.details.decline")}</Button>
      </>}
    >
      <Typography>{Locale.label("mobile.details.declineAcceptedMessage")}</Typography>
      <TextField
        fullWidth
        size="small"
        sx={{ mt: "16px" }}
        label={Locale.label("mobile.details.declineReason")}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        inputProps={{ maxLength: 255, "data-testid": "decline-reason" }}
      />
    </Sheet>
  );
};
