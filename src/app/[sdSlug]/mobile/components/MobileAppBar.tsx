"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar, Badge, Box, IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChurchIcon from "@mui/icons-material/Church";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { type LinkInterface } from "@churchapps/helpers";
import { Locale, PersonHelper } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { mobileTheme, mobileSlugFromPath, linkTypeToRoute } from "./mobileTheme";
import { getInitials, navigateBack } from "./util";
import { NotificationBellMenu } from "./NotificationBellMenu";
import { TextLink } from "./kit";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";

const tc = mobileTheme.colors;

// Internal church links that get a slot in the phone tab bar / desktop header nav.
export const navLinks = (links: LinkInterface[], max: number) => links
  .filter((l) => l.linkType !== "separator" && l.linkType !== "url" && l.linkType !== "page" && l.linkType !== "votd")
  .map((l) => ({ link: l, route: linkTypeToRoute(l.linkType, l.linkData, l.text, l.url) }))
  .filter((t): t is { link: LinkInterface; route: string } => !!t.route && !t.route.startsWith("http"))
  .slice(0, max);

export const routeSlug = (route: string) => route.split("?")[0].split("/").filter(Boolean).pop() || "";

// Bell + avatar cluster. `onHeader` = white-on-brand variant for the desktop header.
export const MobileHeaderActions = ({ onAvatarClick, onHeader }: { onAvatarClick: () => void; onHeader?: boolean }) => {
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
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <IconButton
        ref={bellRef}
        onClick={() => setBellOpen(true)}
        aria-label={Locale.label("mobile.components.notificationsAndMessages")}
        sx={{ width: 44, height: 44, borderRadius: "8px", color: onHeader ? "rgba(255,255,255,0.85)" : tc.textSecondary }}
      >
        <Badge
          badgeContent={totalUnread}
          max={99}
          color="error"
          overlap="circular"
          invisible={totalUnread === 0}
          sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 16, minWidth: 16, px: "4px", fontWeight: 700, bgcolor: onHeader ? "#fff" : tc.primary, color: onHeader ? tc.header : tc.onPrimary } }}
        >
          <NotificationsNoneIcon sx={{ fontSize: 22 }} />
        </Badge>
      </IconButton>
      <NotificationBellMenu anchorEl={bellRef.current} open={bellOpen} onClose={() => setBellOpen(false)} />
      <IconButton onClick={onAvatarClick} aria-label={Locale.label("mobile.components.profile")} sx={{ width: 44, height: 44, borderRadius: "8px" }}>
        <Avatar
          src={photoUrl}
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            bgcolor: onHeader ? "rgba(255,255,255,0.18)" : tc.primary,
            color: onHeader ? "#fff" : tc.onPrimary,
            fontSize: 13,
            fontWeight: 600
          }}
        >
          {initials}
        </Avatar>
      </IconButton>
    </Stack>
  );
};

export const BrandMark = ({ churchName, onHeader }: { churchName?: string; onHeader?: boolean }) => (
  <Box component={Link} href="/mobile/dashboard" sx={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, textDecoration: "none", color: onHeader ? "#fff" : tc.text }}>
    <Box sx={{ width: 30, height: 30, flex: "none", borderRadius: "8px", display: "grid", placeItems: "center", bgcolor: onHeader ? "rgba(255,255,255,0.16)" : tc.primary, color: onHeader ? "#fff" : tc.onPrimary }}>
      <ChurchIcon sx={{ fontSize: 18 }} />
    </Box>
    <Typography noWrap sx={{ fontSize: onHeader ? 16 : 15, fontWeight: 600, color: "inherit" }}>{churchName}</Typography>
  </Box>
);

interface Props {
  churchName?: string;
  rootSlugs: string[];
  onAvatarClick: () => void;
}

// Phone app bar: back on sub-screens, church mark on root screens; the page itself owns the title.
export const useIsRootScreen = (rootSlugs: string[]) => {
  const pathname = usePathname();
  const parts = (pathname || "").split("/").filter(Boolean);
  const isDetail = parts.length > parts.indexOf("mobile") + 2;
  return !isDetail && rootSlugs.includes(mobileSlugFromPath(pathname) || "dashboard");
};

// Desktop has no app bar, so sub-screens get a quiet back verb above the content; record slices bring their own.
export const DesktopBack = ({ rootSlugs }: { rootSlugs: string[] }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRoot = useIsRootScreen(rootSlugs);
  if (isRoot || searchParams?.get("view")) return null;
  return (
    <Box sx={{ display: { xs: "none", md: "block" }, mb: "16px" }}>
      <TextLink onClick={() => navigateBack(router, "/mobile/dashboard")}><ArrowBackIcon sx={{ fontSize: 18 }} />{Locale.label("mobile.components.back")}</TextLink>
    </Box>
  );
};

export const MobileAppBar = ({ churchName, rootSlugs, onAvatarClick }: Props) => {
  const router = useRouter();
  const isRoot = useIsRootScreen(rootSlugs);

  return (
    <Box
      component="header"
      sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bgcolor: tc.background,
        color: tc.text,
        pt: mobileTheme.safe.top,
        zIndex: (theme) => theme.zIndex.appBar
      }}
    >
      <Box sx={{ height: mobileTheme.headerHeight, display: "flex", alignItems: "center", gap: "4px", pl: "8px", pr: "6px" }}>
        {isRoot
          ? <Box sx={{ pl: "8px", minWidth: 0, flex: 1, display: "flex" }}><BrandMark churchName={churchName} /></Box>
          : (
            <>
              <IconButton
                onClick={() => navigateBack(router, "/mobile/dashboard")}
                aria-label={Locale.label("mobile.components.backToDashboard")}
                sx={{ width: 44, height: 44, borderRadius: "8px", color: tc.textSecondary }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ flex: 1 }} />
            </>
          )}
        <MobileHeaderActions onAvatarClick={onAvatarClick} />
      </Box>
    </Box>
  );
};

// Desktop header (md+): church-colored bar carrying the main nav, like B1Admin's header.
export const MobileTopHeader = ({ churchName, links, onAvatarClick }: { churchName?: string; links: LinkInterface[]; onAvatarClick: () => void }) => {
  const pathname = usePathname();
  const slug = mobileSlugFromPath(pathname) || "dashboard";
  const items = [
    { key: "home", href: "/mobile/dashboard", label: Locale.label("mobile.components.home"), active: slug === "dashboard" },
    ...navLinks(links, 5).map(({ link, route }) => ({ key: link.id || route, href: route, label: link.text || "", active: slug === routeSlug(route) })),
    { key: "more", href: "/mobile/more", label: Locale.label("mobile.components.more"), active: slug === "more" }
  ];

  return (
    <Box
      component="header"
      sx={{
        display: { xs: "none", md: "flex" },
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        height: 60,
        alignItems: "center",
        gap: "6px",
        px: "20px",
        bgcolor: tc.header,
        color: "#fff"
      }}
    >
      <BrandMark churchName={churchName} onHeader />
      <Box component="nav" aria-label={Locale.label("mobile.components.navigation")} sx={{ display: "flex", gap: "2px", ml: "24px", minWidth: 0, overflow: "hidden" }}>
        {items.map((i) => (
          <Box
            key={i.key}
            component={Link}
            href={i.href}
            aria-current={i.active ? "page" : undefined}
            sx={{
              height: 36,
              px: "12px",
              borderRadius: "6px",
              display: "inline-flex",
              alignItems: "center",
              fontSize: 14.5,
              fontWeight: 500,
              whiteSpace: "nowrap",
              textDecoration: "none",
              color: i.active ? "#fff" : "rgba(255,255,255,0.82)",
              bgcolor: i.active ? "rgba(255,255,255,0.14)" : "transparent",
              "&:hover": { bgcolor: "rgba(255,255,255,0.10)", color: "#fff" }
            }}
          >
            {i.label}
          </Box>
        ))}
      </Box>
      <Box sx={{ flex: 1 }} />
      <MobileHeaderActions onAvatarClick={onAvatarClick} onHeader />
    </Box>
  );
};
