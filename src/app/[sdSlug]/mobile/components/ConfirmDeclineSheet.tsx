"use client";

import React from "react";
import { Button, Typography } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { Sheet } from "./kit";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeclineSheet = ({ open, onClose, onConfirm }: Props) => (
  <Sheet
    open={open}
    onClose={onClose}
    title={Locale.label("mobile.details.declineAcceptedTitle")}
    maxWidth="xs"
    actions={<>
      <Button variant="outlined" onClick={onClose}>{Locale.label("mobile.details.cancel")}</Button>
      <Button variant="contained" color="error" onClick={() => { onClose(); onConfirm(); }}>{Locale.label("mobile.details.decline")}</Button>
    </>}
  >
    <Typography>{Locale.label("mobile.details.declineAcceptedMessage")}</Typography>
  </Sheet>
);
