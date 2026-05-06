"use client";

import React, { useContext, useMemo } from "react";
import { Box, Button, Icon, Typography } from "@mui/material";
import { Locale, UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "./mobileTheme";
import { useMobileThemeMode } from "./MobileThemeProvider";

interface Props {
  config: ConfigurationInterface;
}

export const EmptyDashboardPlaceholder = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const context = useContext(UserContext);
  const { mode } = useMobileThemeMode();

  const churchName = config?.church?.name || "";
  const logoLight = config?.appearance?.logoLight;
  const logoDark = (config?.appearance as any)?.logoDark;
  const heroLogo = mode === "dark" ? (logoLight || logoDark) : (logoDark || logoLight);

  const canAccessAdmin = !!UserHelper.currentUserChurch
    && UserHelper.checkAccess(Permissions.contentApi.content.edit);

  const adminUrl = useMemo(() => {
    if (!canAccessAdmin || !context?.userChurch?.jwt || !context?.userChurch?.church?.id) return "";
    const url = new URL("/login", EnvironmentHelper.Common.B1AdminRoot);
    url.searchParams.set("jwt", context.userChurch.jwt);
    url.searchParams.set("churchId", context.userChurch.church.id);
    url.searchParams.set("returnUrl", "/mobile/navigation");
    return url.toString();
  }, [canAccessAdmin, context?.userChurch?.jwt, context?.userChurch?.church?.id]);

  return (
    <Box sx={{
      bgcolor: tc.background,
      minHeight: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      px: `${mobileTheme.spacing.lg}px`,
      py: `${mobileTheme.spacing.xl}px`
    }}>
      <Box sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.xl}px`,
        p: 4,
        textAlign: "center",
        boxShadow: mobileTheme.shadows.md,
        maxWidth: 440,
        width: "100%"
      }}>
        {heroLogo ? (
          <Box
            component="img"
            src={heroLogo}
            alt={churchName}
            sx={{ height: 80, maxWidth: "70%", objectFit: "contain", mb: 2, mx: "auto", display: "block" }}
          />
        ) : (
          <Box sx={{
            width: 72,
            height: 72,
            borderRadius: "36px",
            bgcolor: tc.iconBackground,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2
          }}>
            <Icon sx={{ fontSize: 36, color: tc.primary }}>church</Icon>
          </Box>
        )}
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: 1 }}>
          {churchName || Locale.label("mobile.empty.dashboardTitleFallback")}
        </Typography>
        <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: canAccessAdmin && adminUrl ? 3 : 0 }}>
          {canAccessAdmin
            ? Locale.label("mobile.empty.dashboardAdminBody")
            : Locale.label("mobile.empty.dashboardMemberBody")}
        </Typography>
        {canAccessAdmin && adminUrl && (
          <Button
            component="a"
            href={adminUrl}
            variant="contained"
            disableElevation
            sx={{
              bgcolor: tc.primary,
              color: tc.onPrimary,
              textTransform: "none",
              borderRadius: `${mobileTheme.radius.md}px`,
              px: 3,
              py: 1,
              "&:hover": { bgcolor: tc.primary, opacity: 0.9 }
            }}
          >
            {Locale.label("mobile.empty.dashboardAdminCta")}
          </Button>
        )}
      </Box>
    </Box>
  );
};
