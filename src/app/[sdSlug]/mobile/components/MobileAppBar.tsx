"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppBar, Avatar, Badge, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { UserHelper } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "./mobileTheme";
import { useMobileThemeMode } from "./MobileThemeProvider";

interface Props {
  config: ConfigurationInterface;
  primaryColor: string;
  drawerWidth: number;
  onMenuClick: () => void;
  onAvatarClick: () => void;
  onBellClick: () => void;
}

// Per-screen titles shown in the header (center). Keys are mobile page slugs.
// Dashboard is special-cased (renders the church logo/name instead of a title).
const SCREEN_TITLES: Record<string, string> = {
  myGroups: "My Groups",
  groups: "My Groups",
  groupDetails: "Group",
  notifications: "Notifications",
  votd: "Verse of the Day",
  service: "Check-in",
  checkin: "Check-in",
  donation: "Giving",
  donate: "Giving",
  membersSearch: "Directory",
  community: "Directory",
  memberDetail: "Member Details",
  plan: "Plans",
  plans: "Plans",
  planDetails: "Plan",
  sermons: "Sermons",
  sermonDetails: "Sermon",
  playlist: "Playlist",
  playlistDetails: "Playlist",
  searchMessageUser: "Messages",
  messages: "Messages",
  messagesNew: "New Message",
  composeMessage: "New Message",
  registrations: "Registrations",
  register: "Register",
  volunteerBrowse: "Volunteer Opportunities",
  volunteer: "Volunteer",
  volunteerSignup: "Volunteer",
  profileEdit: "Edit Profile",
  stream: "Stream",
  bible: "Bible",
  lessons: "Lessons",
  login: "Sign In",
  install: "Install App",
  page: "",
  websiteUrl: "",
};

// Extract the current mobile page slug from the pathname. Works whether the
// URL is rewritten (/{sdSlug}/mobile/X) or direct (/mobile/X).
const pageSlugFromPath = (pathname: string | null): string => {
  if (!pathname) return "";
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("mobile");
  if (idx === -1) return "";
  return parts[idx + 1] || "dashboard";
};

export const MobileAppBar = ({ config, primaryColor, drawerWidth, onMenuClick, onAvatarClick, onBellClick }: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const { mode } = useMobileThemeMode();
  const slug = pageSlugFromPath(pathname);
  const isDashboard = !slug || slug === "dashboard";
  const title = SCREEN_TITLES[slug] ?? "";

  // Matches B1Mobile's header logo picking: in light mode prefer the
  // dark-inked logo, in dark mode prefer the light-inked logo. Falls back
  // to the other variant if the preferred one isn't configured.
  const logoLight = config?.appearance?.logoLight;
  const logoDark = (config?.appearance as any)?.logoDark;
  const headerLogo = mode === "dark" ? (logoLight || logoDark) : (logoDark || logoLight);
  const signedIn = !!UserHelper.user?.firstName;
  const initials = [UserHelper.user?.firstName?.[0], UserHelper.user?.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

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
        zIndex: (theme) => theme.zIndex.drawer - 1,
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
                  fontWeight: 600,
                }}>
                  {initials || "?"}
                </Avatar>
              </IconButton>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
