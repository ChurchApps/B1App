"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Box, Button, Divider, Icon, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import ChurchIcon from "@mui/icons-material/Church";
import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { UserHelper } from "@churchapps/apphelper";
import { type LinkInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme, linkTypeToIcon, linkTypeToRoute } from "./mobileTheme";
import { useMobileThemeMode } from "./MobileThemeProvider";

interface Props {
  config: ConfigurationInterface;
  links: LinkInterface[];
  onNavigate?: () => void;
}

export const MobileDrawer = ({ config, links, onNavigate }: Props) => {
  const context = useContext(UserContext);
  const router = useRouter();
  const pathname = usePathname();
  const tc = mobileTheme.colors;
  const { mode, toggle } = useMobileThemeMode();

  const personPhoto = context?.person?.photo;
  const contentRoot = (typeof window !== "undefined" ? (window as any).__envVars?.ContentRoot : undefined) || "";
  const photoUrl = personPhoto ? (personPhoto.startsWith("http") ? personPhoto : `${contentRoot}${personPhoto}`) : undefined;
  const firstName = UserHelper.user?.firstName || "";
  const lastName = UserHelper.user?.lastName || "";
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";

  const isActive = (url: string): boolean => {
    if (!pathname || url.startsWith("http")) return false;
    const idx = pathname.indexOf("/mobile");
    if (idx === -1) return false;
    const relevant = pathname.substring(idx);
    return relevant === url || relevant.startsWith(url + "/");
  };

  const handleEditProfile = () => {
    onNavigate?.();
    router.push("/mobile/profileEdit");
  };

  const handleChurchSelect = () => {
    onNavigate?.();
    router.push("/mobile/churchSearch");
  };

  return (
    <Box role="navigation" aria-label="Main navigation" sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: tc.surface }}>
      {/* Header with user + church select */}
      <Box sx={{
        p: `${mobileTheme.spacing.md}px`,
        borderBottom: `1px solid ${tc.border}`,
        boxShadow: mobileTheme.shadows.sm,
      }}>
        {UserHelper.user && (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            {photoUrl ? (
              <Avatar src={photoUrl} sx={{ width: 48, height: 48 }} />
            ) : (
              <Avatar sx={{ width: 48, height: 48, bgcolor: tc.primary, fontSize: 18, fontWeight: 600 }}>
                {initials}
              </Avatar>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>
                {firstName} {lastName}
              </Typography>
              <Box
                component="button"
                onClick={handleEditProfile}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  bgcolor: tc.iconBackground,
                  border: "none",
                  borderRadius: `${mobileTheme.radius.sm}px`,
                  padding: "6px 8px",
                  cursor: "pointer",
                  color: tc.primary,
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                <EditIcon sx={{ fontSize: 16, color: tc.primary }} />
                Edit Profile
              </Box>
            </Box>
          </Stack>
        )}
        <Button
          variant="contained"
          fullWidth
          disableElevation
          startIcon={config?.appearance ? <ChurchIcon sx={{ fontSize: 20 }} /> : <SearchIcon sx={{ fontSize: 20 }} />}
          onClick={handleChurchSelect}
          sx={{
            bgcolor: tc.surface,
            color: tc.primary,
            borderRadius: `${mobileTheme.radius.md}px`,
            textTransform: "none",
            fontWeight: 500,
            fontSize: 14,
            boxShadow: mobileTheme.shadows.sm,
            justifyContent: "flex-start",
            py: 1,
            "&:hover": { bgcolor: tc.iconBackground, boxShadow: mobileTheme.shadows.sm },
          }}
        >
          {config?.church?.name || "Select Church"}
        </Button>
      </Box>

      {/* Nav list */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {links.map((link, idx) => {
          if (link.linkType === "separator") {
            return <Divider key={`sep-${idx}`} sx={{ my: 1 }} />;
          }
          const route = linkTypeToRoute(link.linkType, link.linkData);
          if (!route) return null;
          const active = isActive(route);
          const iconName = linkTypeToIcon(link.linkType, link.icon);
          return (
            <Link key={link.id || `${link.linkType}-${idx}`} href={route} style={{ textDecoration: "none", color: "inherit" }} onClick={onNavigate}>
              <Box sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                minHeight: 48,
                px: `${mobileTheme.spacing.md}px`,
                py: `${mobileTheme.spacing.sm + 4}px`,
                borderBottom: `1px solid ${tc.border}`,
                bgcolor: active ? tc.primary : "transparent",
                cursor: "pointer",
                "&:hover": { bgcolor: active ? tc.primary : tc.iconBackground },
              }}>
                {(link as any).photo ? (
                  <Box component="img" src={(link as any).photo} alt="" sx={{ width: 24, height: 24, objectFit: "cover", borderRadius: 0.5 }} />
                ) : (
                  <Icon sx={{ fontSize: 24, color: active ? "#FFFFFF" : tc.primary }}>{iconName}</Icon>
                )}
                <Typography sx={{
                  fontSize: 16,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#FFFFFF" : tc.text,
                  flex: 1,
                  minWidth: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {link.text}
                </Typography>
              </Box>
            </Link>
          );
        })}
      </Box>

      {/* Footer */}
      <Box sx={{
        p: `${mobileTheme.spacing.md}px`,
        borderTop: `1px solid ${tc.border}`,
        boxShadow: mobileTheme.shadows.sm,
      }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={mode === "dark"
            ? <LightModeIcon sx={{ fontSize: 24, color: tc.primary }} />
            : <DarkModeIcon sx={{ fontSize: 24, color: tc.primary }} />}
          onClick={toggle}
          aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          sx={{
            color: tc.primary,
            borderColor: tc.primary,
            borderRadius: `${mobileTheme.radius.md}px`,
            textTransform: "none",
            fontWeight: 500,
            fontSize: 14,
            justifyContent: "flex-start",
            py: 1,
            mb: 1,
          }}
        >
          {mode === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
        {UserHelper.user ? (
          <Button
            variant="outlined"
            fullWidth
            startIcon={<LogoutIcon sx={{ fontSize: 24, color: tc.primary }} />}
            component="a"
            href="/logout"
            sx={{
              color: tc.primary,
              borderColor: tc.primary,
              borderRadius: `${mobileTheme.radius.md}px`,
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              justifyContent: "flex-start",
              py: 1,
              mb: 1,
            }}
          >
            Logout
          </Button>
        ) : (
          <Button
            variant="contained"
            fullWidth
            disableElevation
            startIcon={<LoginIcon sx={{ fontSize: 24 }} />}
            component="a"
            href={(() => {
              // Stay inside the mobile shell instead of bouncing to the public
              // desktop login page.
              const returnUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname) : "";
              return returnUrl ? `/mobile/login?returnUrl=${returnUrl}` : "/mobile/login";
            })()}
            sx={{
              bgcolor: tc.primary,
              color: tc.onPrimary,
              borderRadius: `${mobileTheme.radius.md}px`,
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              justifyContent: "flex-start",
              py: 1,
              mb: 1,
              "&:hover": { bgcolor: tc.primary },
            }}
          >
            Sign In
          </Button>
        )}
        <Typography sx={{ fontSize: 12, color: tc.disabled, textAlign: "center" }}>
          B1 Mobile Web
        </Typography>
        <Typography sx={{ fontSize: 12, textAlign: "center", mt: 0.5 }}>
          <Box
            component="a"
            href="https://churchapps.org/privacy"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: tc.primary, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          >
            Privacy Policy
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};
