"use client";

import React from "react";
import { Alert, Button } from "@mui/material";
import { Locale } from "@churchapps/apphelper";

export const LoadErrorAlert = ({ onRetry }: { onRetry: () => void }) => (
  <Alert
    severity="error"
    data-testid="load-error"
    action={<Button color="inherit" size="small" onClick={onRetry}>{Locale.label("mobile.screens.retry")}</Button>}
  >
    {Locale.label("mobile.screens.sermonsLoadErrorBody")}
  </Alert>
);
