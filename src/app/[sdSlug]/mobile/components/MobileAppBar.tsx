"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppBar, Avatar, Badge, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { Locale, PersonHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, SCREEN_TITLES, mobileSlugFromPath } from "./mobileTheme";
import { getInitials } from "./util";
import { NotificationBellMenu } from "./NotificationBellMenu";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";

interface Props {
  config: ConfigurationInterface;
  drawerWidth: number;
  onAvatarClick: () => void;
}

// Bell + avatar cluster, shared between the sub-screen app bar and the dashboard's own header.
export const MobileHeaderActions = ({ onAvatarClick }: { onAvatarClick: () => void }) => {
  const tc = mobileTheme.colors;
  const userContext = React.useContext(UserContext);
  const { counts } = useRealtimeNotifications(userContext ?? null);
  const totalUnread = (counts?.pmCount || 0) + (counts?.notificationCount || 0);
  const bellRef = React.useRef<HTMLButtonElement | null>(null);
  const [bellOpen, setBellOpen] = React.useState(false);

  const signedIn = !!userContext?.user?.firstName;
  const initials = getInitials({ name: { first: userContext?.user?.firstName, last: userContext?.user?.lastName } });
  const photoUrl = userContext?.person?.photo ? PersonHelper.getPhotoUrl(userContext.person) : undefined;

  if (!signedIn) return null;

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <IconButton
        ref={bellRef}
        onClick={() => setBellOpen(true)}
        aria-label={Locale.label("mobile.components.notificationsAndMessages")}
        sx={{ width: 38, height: 38, bgcolor: tc.surface, border: `1px solid ${tc.border}`, color: tc.text }}
      >
        <Badge
          badgeContent={totalUnread}
          max={99}
          color="error"
          overlap="circular"
          invisible={totalUnread === 0}
          sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 15, minWidth: 15, px: "4px", fontWeight: 700 } }}
        >
          <NotificationsNoneIcon sx={{ fontSize: 21 }} />
        </Badge>
      </IconButton>
      <NotificationBellMenu anchorEl={bellRef.current} open={bellOpen} onClose={() => setBellOpen(false)} />
      <IconButton onClick={onAvatarClick} aria-label={Locale.label("mobile.components.profile")} sx={{ p: 0 }}>
        <Avatar
          src={photoUrl}
          sx={{
            width: 38,
            height: 38,
            bgcolor: tc.primaryLight,
            color: tc.primary,
            fontSize: 13,
            fontWeight: 700
          }}
        >
          {initials}
        </Avatar>
      </IconButton>
    </Stack>
  );
};

export const MobileAppBar = ({ drawerWidth, onAvatarClick }: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const tc = mobileTheme.colors;
  const slug = mobileSlugFromPath(pathname);
  const isDashboard = !slug || slug === "dashboard";
  const title = SCREEN_TITLES[slug] ?? "";

  if (isDashboard) return null;

  const handleBack = () => {
    router.push("/mobile/dashboard");
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: tc.background,
        color: tc.text,
        borderBottom: `1px solid ${tc.border}`,
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        pt: "env(safe-area-inset-top)",
        zIndex: (theme) => theme.zIndex.drawer - 1
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: `${mobileTheme.headerHeight}px !important`, px: "12px" }}>
        <IconButton
          onClick={handleBack}
          aria-label={Locale.label("mobile.components.backToDashboard")}
          sx={{ width: 38, height: 38, bgcolor: tc.surface, border: `1px solid ${tc.border}`, color: tc.text }}
        >
          <ChevronLeftIcon sx={{ fontSize: 24 }} />
        </IconButton>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <Typography noWrap sx={{ fontFamily: mobileTheme.fonts.serif, fontSize: 20, fontWeight: 600, color: tc.text, px: 1 }}>
            {title}
          </Typography>
        </div>
        <MobileHeaderActions onAvatarClick={onAvatarClick} />
      </Toolbar>
    </AppBar>
  );
};
