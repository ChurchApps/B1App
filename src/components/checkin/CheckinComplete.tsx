"use client";
import React, { useEffect } from "react";
import { Box, Icon, Typography } from "@mui/material";
import { colors } from "./CheckinStyles";

interface Props {
  onDone?: () => void;
}

export function CheckinComplete({ onDone }: Props) {
  useEffect(() => {
    if (!onDone) return;
    const id = setTimeout(() => {
      onDone();
    }, 1500);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        borderRadius: 3,
        background: `linear-gradient(135deg, ${colors.primary} 0%, #568BDA 100%)`,
        padding: 4
      }}
      data-testid="checkin-complete"
    >
      <Box sx={{ textAlign: "center", maxWidth: 400, width: "100%" }}>
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 auto 24px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
          }}
        >
          <Icon sx={{ fontSize: 80, color: colors.success }}>check_circle</Icon>
        </Box>
        <Typography
          variant="h4"
          sx={{
            color: "#FFFFFF",
            fontWeight: 800,
            marginBottom: 2,
            textShadow: "0 2px 4px rgba(0,0,0,0.3)"
          }}
        >
          Check-in Complete
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: "#FFFFFF",
            opacity: 0.9,
            textShadow: "0 1px 2px rgba(0,0,0,0.2)"
          }}
        >
          Your attendance has been saved. Thank you!
        </Typography>
      </Box>
    </Box>
  );
}
