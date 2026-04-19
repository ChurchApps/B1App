"use client";

import React from "react";
import { AppBar, Avatar, Badge, Icon, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { UserHelper } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "./mobileTheme";

interface Props {
  config: ConfigurationInterface;
  primaryColor: string;
  drawerWidth: number;
  onMenuClick: () => void;
  onAvatarClick: () => void;
  onBellClick: () => void;
}

export const MobileAppBar = ({ config, primaryColor, drawerWidth, onMenuClick, onAvatarClick, onBellClick }: Props) => {
  const logoLight = config?.appearance?.logoLight;
  const signedIn = !!UserHelper.user?.firstName;
  const initials = [UserHelper.user?.firstName?.[0], UserHelper.user?.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const handleAvatarClick = () => {
    if (signedIn) {
      onAvatarClick();
    } else {
      // Route within the mobile shell so the user keeps the church-branded UI
      // instead of bouncing out to the public desktop login page.
      const returnUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
      window.location.href = returnUrl ? `/mobile/login?returnUrl=${returnUrl}` : "/mobile/login";
    }
  };

  return (
    <AppBar
      position="fixed"
      elevation={2}
      sx={{
        bgcolor: primaryColor,
        color: "#FFFFFF",
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: `${mobileTheme.headerHeight}px !important`, px: 1 }}>
        <IconButton
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          sx={{ color: "#FFFFFF", mx: 0.5, display: { md: "none" } }}
        >
          <MenuIcon sx={{ fontSize: 27 }} />
        </IconButton>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {logoLight ? (
            <img
              src={logoLight}
              alt={config?.church?.name || ""}
              style={{ height: 30, width: "auto", maxWidth: "60%", objectFit: "contain" }}
            />
          ) : (
            <Typography noWrap sx={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", px: 1 }}>
              {config?.church?.name || ""}
            </Typography>
          )}
        </div>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ pr: 1 }}>
          {signedIn && (
            <IconButton onClick={onBellClick} aria-label="Notifications" sx={{ color: "#FFFFFF" }}>
              <Badge variant="dot" color="error" invisible>
                <NotificationsNoneIcon sx={{ fontSize: 24 }} />
              </Badge>
            </IconButton>
          )}
          <IconButton onClick={handleAvatarClick} aria-label={signedIn ? "Profile" : "Sign in"} sx={{ p: 0.5 }}>
            {signedIn ? (
              <Avatar sx={{
                width: 30,
                height: 30,
                bgcolor: "rgba(255,255,255,0.25)",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 600,
              }}>
                {initials || "?"}
              </Avatar>
            ) : (
              <Icon sx={{ color: "#FFFFFF", fontSize: 26 }}>login</Icon>
            )}
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
