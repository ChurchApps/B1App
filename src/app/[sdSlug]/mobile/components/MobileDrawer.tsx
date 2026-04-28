"use client";

import React, { useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Box, Button, Divider, Icon, Stack, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { type LinkInterface } from "@churchapps/helpers";
import { Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { mobileTheme, linkTypeToIcon, linkTypeToRoute } from "./mobileTheme";
import { getInitials } from "./util";
import { useMobileThemeMode } from "./MobileThemeProvider";

interface Props {
  links: LinkInterface[];
  onNavigate?: () => void;
}

export const MobileDrawer = ({ links, onNavigate }: Props) => {
  const context = useContext(UserContext);
  const router = useRouter();
  const pathname = usePathname();
  const tc = mobileTheme.colors;
  const { mode, toggle } = useMobileThemeMode();

  const personPhoto = context?.person?.photo;
  const contentRoot = (typeof window !== "undefined" ? (window as any).__envVars?.ContentRoot : undefined) || "";
  const photoUrl = personPhoto ? (personPhoto.startsWith("http") ? personPhoto : `${contentRoot}${personPhoto}`) : undefined;
  const firstName = context?.person?.name?.first || context?.user?.firstName || "";
  const lastName = context?.person?.name?.last || context?.user?.lastName || "";
  const initials = getInitials({ name: { first: firstName, last: lastName } });

  const isActive = (url: string): boolean => {
    if (!pathname || url.startsWith("http")) return false;
    const idx = pathname.indexOf("/mobile");
    if (idx === -1) return false;
    const relevant = pathname.substring(idx).split("?")[0];
    const target = url.split("?")[0];

    if (target === "/mobile/dashboard") return false;
    return relevant === target || relevant.startsWith(target + "/");
  };

  const handleEditProfile = () => {
    onNavigate?.();
    router.push("/mobile/profileEdit");
  };

  return (
    <Box role="navigation" aria-label={Locale.label("mobile.components.navigation")} sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: tc.surface }}>

      <Box sx={{
        p: `${mobileTheme.spacing.md}px`,
        borderBottom: `1px solid ${tc.border}`,
        boxShadow: mobileTheme.shadows.sm
      }}>
        {context?.user && (
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
                  lineHeight: 1
                }}
              >
                <EditIcon sx={{ fontSize: 16, color: tc.primary }} />
                {Locale.label("mobile.components.editProfile")}
              </Box>
            </Box>
          </Stack>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {links.map((link, idx) => {
          if (link.linkType === "separator") {
            return <Divider key={`sep-${idx}`} sx={{ my: 1 }} />;
          }
          const route = linkTypeToRoute(link.linkType, link.linkData, link.text, link.url);
          if (!route) return null;
          const isExternal = route.startsWith("http");
          const active = !isExternal && isActive(route);
          const iconName = linkTypeToIcon(link.linkType, link.icon);
          const key = link.id || `${link.linkType}-${idx}`;
          const anchorStyle = { textDecoration: "none", color: "inherit" } as const;
          const body = (
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
              "&:hover": { bgcolor: active ? tc.primary : tc.iconBackground }
            }}>
              <Icon sx={{ fontSize: 24, color: active ? tc.onPrimary : tc.primary }}>{iconName}</Icon>
              <Typography sx={{
                fontSize: 16,
                fontWeight: active ? 600 : 500,
                color: active ? tc.onPrimary : tc.text,
                flex: 1,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {link.text}
              </Typography>
            </Box>
          );

          if (isExternal) {
            return (
              <a key={key} href={route} target="_blank" rel="noopener noreferrer" style={anchorStyle} onClick={onNavigate}>
                {body}
              </a>
            );
          }
          return (
            <Link key={key} href={route} style={anchorStyle} onClick={onNavigate}>
              {body}
            </Link>
          );
        })}
      </Box>

      <Box sx={{
        p: `${mobileTheme.spacing.md}px`,
        borderTop: `1px solid ${tc.border}`,
        boxShadow: mobileTheme.shadows.sm
      }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={mode === "dark"
            ? <LightModeIcon sx={{ fontSize: 24, color: tc.primary }} />
            : <DarkModeIcon sx={{ fontSize: 24, color: tc.primary }} />}
          onClick={toggle}
          aria-label={mode === "dark" ? Locale.label("mobile.components.switchToLight") : Locale.label("mobile.components.switchToDark")}
          sx={{
            color: tc.primary,
            borderColor: tc.primary,
            borderRadius: `${mobileTheme.radius.md}px`,
            textTransform: "none",
            fontWeight: 500,
            fontSize: 14,
            justifyContent: "flex-start",
            py: 1,
            mb: 1
          }}
        >
          {mode === "dark" ? Locale.label("mobile.components.lightMode") : Locale.label("mobile.components.darkMode")}
        </Button>
        {context?.user ? (
          <Button
            variant="outlined"
            fullWidth
            startIcon={<LogoutIcon sx={{ fontSize: 24, color: tc.primary }} />}
            component="a"
            href="/mobile/logout"
            sx={{
              color: tc.primary,
              borderColor: tc.primary,
              borderRadius: `${mobileTheme.radius.md}px`,
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              justifyContent: "flex-start",
              py: 1,
              mb: 1
            }}
          >
            {Locale.label("mobile.components.logout")}
          </Button>
        ) : (
          <Button
            variant="contained"
            fullWidth
            disableElevation
            startIcon={<LoginIcon sx={{ fontSize: 24 }} />}
            component="a"
            href={(() => {

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
              "&:hover": { bgcolor: tc.primary }
            }}
          >
            {Locale.label("mobile.components.signIn")}
          </Button>
        )}
        <Typography sx={{ fontSize: 12, color: tc.disabled, textAlign: "center" }}>
          {Locale.label("mobile.components.b1MobileWeb")}
        </Typography>
        <Typography sx={{ fontSize: 12, textAlign: "center", mt: 0.5 }}>
          <Box
            component="a"
            href="https://churchapps.org/privacy"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: tc.primary, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          >
            {Locale.label("mobile.components.privacyPolicy")}
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};