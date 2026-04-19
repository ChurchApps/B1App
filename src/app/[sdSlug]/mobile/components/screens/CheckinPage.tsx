"use client";

import React, { useCallback, useState } from "react";
import { Box, Typography, Icon } from "@mui/material";
import { UserHelper } from "@churchapps/apphelper";
import { CheckinComplete, Household, Services } from "@/components";
import { CheckinHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

type Step = "services" | "household" | "complete";

export const CheckinPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const [step, setStep] = useState<Step>("services");

  if (!UserHelper.user?.firstName) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.xl}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "32px",
              bgcolor: tc.iconBackground,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              mb: `${mobileTheme.spacing.md}px`,
            }}
          >
            <Icon sx={{ fontSize: 32, color: tc.primary }}>how_to_reg</Icon>
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>
            Please sign in to check in
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
            Log in to check in to a service.
          </Typography>
        </Box>
      </Box>
    );
  }

  const handleCompleteDone = useCallback(() => {
    CheckinHelper.clearData();
    setStep("services");
  }, []);

  let content: React.ReactNode = null;
  if (step === "services") content = <Services selectedHandler={() => setStep("household")} />;
  else if (step === "household") content = <Household completeHandler={() => setStep("complete")} />;
  else if (step === "complete") content = <CheckinComplete onDone={handleCompleteDone} />;

  return (
    <Box
      sx={{
        p: `${mobileTheme.spacing.md}px`,
        bgcolor: tc.background,
        minHeight: "100%",
        // Slight primary accent so cards pop like B1Mobile
        "& .MuiCardActionArea-root": {
          borderLeft: `4px solid ${tc.primary}`,
          borderTopLeftRadius: `${mobileTheme.radius.lg}px`,
          borderBottomLeftRadius: `${mobileTheme.radius.lg}px`,
        },
      }}
    >
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tc.text, mb: `${mobileTheme.spacing.md}px` }}>
        Check-in
      </Typography>
      {content}
    </Box>
  );
};
