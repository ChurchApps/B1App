"use client";

import React, { useContext, useEffect, useState } from "react";
import { Box, Icon, Typography } from "@mui/material";
import UserContext from "@/context/UserContext";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { mobileTheme } from "../mobileTheme";

export const LessonsPage = () => {
  const context = useContext(UserContext);
  const tc = mobileTheme.colors;
  const [isClient, setIsClient] = useState(false);

  const jwt = context.userChurch?.jwt;
  const churchId = context.userChurch?.church?.id;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const iframeSrc =
    jwt && churchId
      ? `${EnvironmentHelper.Common.LessonsRoot}/login?jwt=${jwt}&returnUrl=/b1/person&churchId=${churchId}`
      : null;

  // Signed-out state — friendly empty card
  if (!jwt || !churchId) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.xl}px`,
          p: 4,
          textAlign: "center",
          boxShadow: mobileTheme.shadows.md,
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
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            Sign in to view lessons
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
            Lessons are available to signed-in members of this church.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      bgcolor: tc.background,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
    }}>
      {isClient && iframeSrc ? (
        <Box
          component="iframe"
          title="Lessons"
          src={iframeSrc}
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
            Loading lessons...
          </Typography>
        </Box>
      )}
    </Box>
  );
};
