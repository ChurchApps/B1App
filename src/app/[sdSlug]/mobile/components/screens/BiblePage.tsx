"use client";

import React, { useEffect, useState } from "react";
import { Box, Icon, Typography } from "@mui/material";
import { mobileTheme } from "../mobileTheme";

export const BiblePage = () => {
  const tc = mobileTheme.colors;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Uses the same biblia.com embed that the existing /[pageSlug] BiblePage uses
  // (see src/app/[sdSlug]/[pageSlug]/components/BiblePage.tsx). The YouVersion SDK
  // is also available as a dep, but the default site path ships the biblia embed
  // so we mirror that here for consistency with the rest of the app.
  const src = "https://biblia.com/api/plugins/embeddedbible?layout=normal&historyButtons=false&resourcePicker=false&shareButton=false&textSizeButton=false&startingReference=Ge1.1&resourceName=nirv";

  return (
    <Box sx={{
      bgcolor: tc.background,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
    }}>
      {isClient ? (
        <Box
          component="iframe"
          title="Bible"
          src={src}
          sx={{
            width: "100%",
            flex: 1,
            minHeight: `calc(100vh - ${mobileTheme.headerHeight}px)`,
            border: 0,
            bgcolor: tc.surface,
          }}
        />
      ) : (
        <Box sx={{
          p: `${mobileTheme.spacing.md}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}>
          <Box sx={{
            width: 72,
            height: 72,
            borderRadius: "36px",
            bgcolor: tc.iconBackground,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}>
            <Icon sx={{ fontSize: 36, color: tc.primary }}>menu_book</Icon>
          </Box>
          <Typography sx={{ fontSize: 16, color: tc.textMuted }}>
            Loading Bible...
          </Typography>
        </Box>
      )}
    </Box>
  );
};
