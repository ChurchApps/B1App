"use client";

import React from "react";
import { Box } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import { QuietEmpty, TextLink } from "./kit";

export const LoadErrorAlert = ({ onRetry }: { onRetry: () => void }) => (
  <Box role="alert" data-testid="load-error">
    <QuietEmpty>{Locale.label("mobile.screens.sermonsLoadErrorBody")}</QuietEmpty>
    <Box sx={{ mt: "8px" }}><TextLink onClick={onRetry}>{Locale.label("mobile.screens.retry")}</TextLink></Box>
  </Box>
);
