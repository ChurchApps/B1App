"use client";

import React from "react";
import { Box, Icon, Typography } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { LiveStream } from "@/components/video/LiveStream";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

export const StreamPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const keyName = config?.church?.subDomain;

  // Offline placeholder shown when no service is live or scheduled within the
  // next hour. LiveStream itself handles countdown, live badge, chat, prayer,
  // and any church-configured interaction tabs when a stream is active.
  const offlineContent = (
    <Box sx={{
      position: "relative",
      width: "100%",
      paddingTop: "56.25%",
      borderRadius: `${mobileTheme.radius.xl}px`,
      overflow: "hidden",
      boxShadow: mobileTheme.shadows.md,
      bgcolor: "#000000",
    }}>
      <Box sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        textAlign: "center",
      }}>
        <Icon sx={{ fontSize: 48, color: "#FFFFFF", opacity: 0.8, mb: 1 }}>live_tv</Icon>
        <Typography sx={{ color: "#FFFFFF", fontSize: 16, fontWeight: 600, mb: 0.5 }}>
          We're not live right now
        </Typography>
        <Typography sx={{ color: "#FFFFFF", opacity: 0.8, fontSize: 14 }}>
          Check back during service times.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.surface, minHeight: "100%" }}>
      {keyName ? (
        <LiveStream
          keyName={keyName}
          appearance={config?.appearance}
          includeHeader={false}
          includeInteraction={true}
          offlineContent={offlineContent}
        />
      ) : offlineContent}
    </Box>
  );
};
