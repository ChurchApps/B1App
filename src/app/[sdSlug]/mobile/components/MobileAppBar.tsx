"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppBar, Avatar, Badge, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { UserHelper } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, SCREEN_TITLES, mobileSlugFromPath } from "./mobileTheme";
import { useMobileThemeMode } from "./MobileThemeProvider";
import { getInitials } from "./util";

interface Props {
  config: ConfigurationInterface;
  primaryColor: string;
  drawerWidth: number;
  onMenuClick: () => void;
  onAvatarClick: () => void;
  onBellClick: () => void;
}

export const MobileAppBar = ({ config, primaryColor, drawerWidth, onMenuClick, onAvatarClick, onBellClick }: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const { mode } = useMobileThemeMode();
  const slug = mobileSlugFromPath(pathname);
  const isDashboard = !slug || slug === "dashboard";
  const title = SCREEN_TITLES[slug] ?? "";

  // Light mode prefers the dark-inked logo; dark mode prefers the light-inked
  // one. Fall back to the other variant if the preferred one isn't configured.
  const logoLight = config?.appearance?.logoLight;
  const logoDark = (config?.appearance as any)?.logoDark;
  const headerLogo = mode === "dark" ? (logoLight || logoDark) : (logoDark || logoLight);
  const signedIn = !!UserHelper.user?.firstName;
  const initials = getInitials({ name: { first: UserHelper.user?.firstName, last: UserHelper.user?.lastName } });

  const handleBack = () => {
    router.push("/mobile/dashboard");
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
        zIndex: (theme) => theme.zIndex.drawer - 1
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: `${mobileTheme.headerHeight}px !important`, px: 1 }}>
        <Stack direction="row" alignItems="center">
          {!isDashboard ? (
            <IconButton
              onClick={handleBack}
              aria-label="Back to dashboard"
              sx={{ color: "#FFFFFF", mx: 0.25 }}
            >
              <ChevronLeftIcon sx={{ fontSize: 27 }} />
            </IconButton>
          ) : (
            <IconButton
              onClick={onMenuClick}
              aria-label="Open navigation menu"
              sx={{ color: "#FFFFFF", mx: 0.5, display: { md: "none" } }}
            >
              <MenuIcon sx={{ fontSize: 27 }} />
            </IconButton>
          )}
        </Stack>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {isDashboard ? (
            headerLogo ? (
              <img
                src={headerLogo}
                alt={config?.church?.name || ""}
                style={{ height: 30, width: "auto", maxWidth: "60%", objectFit: "contain" }}
              />
            ) : (
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", px: 1 }}>
                {config?.church?.name || ""}
              </Typography>
            )
          ) : (
            <Typography noWrap sx={{ fontSize: 18, fontWeight: 600, color: "#FFFFFF", px: 1 }}>
              {title}
            </Typography>
          )}
        </div>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ pr: 1 }}>
          {signedIn && (
            <>
              <IconButton onClick={onBellClick} aria-label="Notifications" sx={{ color: "#FFFFFF" }}>
                <Badge variant="dot" color="error" invisible>
                  <NotificationsNoneIcon sx={{ fontSize: 24 }} />
                </Badge>
              </IconButton>
              <IconButton onClick={onAvatarClick} aria-label="Profile" sx={{ p: 0.5 }}>
                <Avatar sx={{
                  width: 30,
                  height: 30,
                  bgcolor: "rgba(255,255,255,0.25)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600
                }}>
                  {initials}
                </Avatar>
              </IconButton>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
