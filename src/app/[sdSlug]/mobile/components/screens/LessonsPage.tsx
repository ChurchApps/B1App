"use client";

import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Icon, Typography, Button } from "@mui/material";
import { ApiHelper, UserHelper } from "@churchapps/apphelper";
import type { LinkInterface, LoginResponseInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { useChurchLinks } from "../../hooks/useConfig";
import { mobileTheme } from "../mobileTheme";

// Internal paths inside the Lessons iframe that should pop out into native
// /mobile routes instead of navigating inside the frame.
const INTERNAL_ROUTE_MAP: Array<{ match: RegExp; to: (m: RegExpMatchArray) => string }> = [
  { match: /\/my\/groups(?:\/|$|\?)/, to: () => "/mobile/groups" },
  { match: /\/my\/plans(?:\/|$|\?)/, to: () => "/mobile/plans" },
  { match: /\/my\/community(?:\/|$|\?)/, to: () => "/mobile/community" },
  { match: /\/my\/checkin(?:\/|$|\?)/, to: () => "/mobile/checkin" },
  { match: /\/groups\/details\/([\w-]+)/, to: (m) => `/mobile/groups?groupId=${m[1]}` },
  { match: /\/votd(?:\/|$|\?)/, to: () => "/mobile/votd" },
  { match: /\/donate(?:\/|$|\?)/, to: () => "/mobile/donate" },
];

const resolveInternalRoute = (url: string): string | null => {
  try {
    // Accept either a full URL or a bare path.
    const path = url.startsWith("http") ? new URL(url).pathname + new URL(url).search : url;
    for (const entry of INTERNAL_ROUTE_MAP) {
      const m = path.match(entry.match);
      if (m) return entry.to(m);
    }
  } catch {
    /* ignore malformed URLs */
  }
  return null;
};

export const LessonsPage = () => {
  const context = useContext(UserContext);
  const router = useRouter();
  const tc = mobileTheme.colors;
  const [isClient, setIsClient] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jwt = context.userChurch?.jwt;
  const churchId = context.userChurch?.church?.id;

  // Use the label the admin set on the lessons tab/link when available.
  const { data: rawLinks } = useChurchLinks(churchId, jwt);
  const linkTitle = useMemo(() => {
    if (!Array.isArray(rawLinks)) return null;
    const lessonsLink = (rawLinks as LinkInterface[]).find(
      (l) => (l.linkType || "").toLowerCase() === "lessons"
    );
    return lessonsLink?.text || null;
  }, [rawLinks]);
  const title = linkTitle || "Lessons";

  useEffect(() => {
    setIsClient(true);
  }, []);

  const iframeSrc =
    jwt && churchId
      ? `${EnvironmentHelper.Common.LessonsRoot}/login?jwt=${jwt}&returnUrl=/b1/person&churchId=${churchId}`
      : null;

  // Rehydrate the user from the existing JWT after a profile_updated event.
  const reauthenticate = async () => {
    try {
      if (!jwt) return;
      const resp: LoginResponseInterface = await ApiHelper.postAnonymous(
        "/users/login",
        { jwt },
        "MembershipApi"
      );
      if (resp?.user) {
        ApiHelper.setDefaultPermissions(resp.user.jwt);
        UserHelper.user = resp.user;
        UserHelper.userChurches = resp.userChurches || [];
        const current = (resp.userChurches || []).find(
          (uc: any) => uc.church?.id === churchId
        );
        if (current) {
          UserHelper.currentUserChurch = current;
          UserHelper.setupApiHelper(current);
          context.setUser(resp.user);
          context.setUserChurches(resp.userChurches || []);
          context.setUserChurch(current);
        }
      }
    } catch (err) {
      console.warn("LessonsPage: profile re-auth failed", err);
    }
  };

  // postMessage bridge. LessonsApp currently only emits a few message shapes
  // to `window.parent` (height events from embed routes), and
  // `ReactNativeWebView.postMessage("print")` which only reaches native. We
  // still wire the listener for the expected profile_updated / profile_deleted
  // / autoPrint contracts so that once LessonsApp emits them to window.parent
  // the web client will honor them. See follow-up note at the bottom of this
  // file.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from the LessonsRoot origin.
      try {
        const lessonsOrigin = new URL(EnvironmentHelper.Common.LessonsRoot).origin;
        if (event.origin && event.origin !== lessonsOrigin) return;
      } catch {
        /* ignore */
      }

      const data: any = event.data;
      if (!data) return;

      // Accept string or object shapes.
      const type =
        typeof data === "string"
          ? data
          : data.type || data.event || data.message || null;

      if (type === "profile_updated") {
        void reauthenticate();
        return;
      }
      if (type === "profile_deleted") {
        // Server-side logout clears the jwt cookie and redirects home.
        window.location.href = "/logout";
        return;
      }
      if (type === "print" || type === "autoPrint" || data?.autoPrint === 1 || data?.autoPrint === "1") {
        try {
          window.print();
        } catch (err) {
          console.warn("LessonsPage: print failed", err);
        }
        return;
      }

      // Internal-route interception hook. If LessonsApp ever posts a
      // structured nav event (e.g. { type: "navigate", url: "/my/groups" })
      // we'll route it natively. Cross-origin iframe URL sniffing is not
      // possible on web so we rely on this cooperative contract.
      if (type === "navigate" && typeof data?.url === "string") {
        const route = resolveInternalRoute(data.url);
        if (route) router.push(route);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => { window.removeEventListener("message", handleMessage); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt, churchId]);

  // Error fallback: if the iframe never fires `load` within a reasonable
  // window, surface a retry card. (Cross-origin iframe `error` events are
  // unreliable on web, so we also use a load-timeout.)
  useEffect(() => {
    if (!iframeSrc) return;
    setIframeError(false);
    setIframeLoaded(false);
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) setIframeError(true);
    }, 15000);
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iframeSrc]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  const handleRetry = () => {
    setIframeError(false);
    setIframeLoaded(false);
    // Force a reload by re-assigning the iframe's src.
    if (iframeRef.current && iframeSrc) {
      iframeRef.current.src = iframeSrc;
    }
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) setIframeError(true);
    }, 15000);
  };

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
            Sign in to view {title.toLowerCase()}
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
            {title} are available to signed-in members of this church.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (iframeError) {
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
            <Icon sx={{ fontSize: 36, color: tc.primary }}>error_outline</Icon>
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            Unable to load {title.toLowerCase()}
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            Check your connection and try again.
          </Typography>
          <Button variant="contained" onClick={handleRetry} data-testid="lessons-retry-button">
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      bgcolor: tc.surface,
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
    }}>
      {isClient && iframeSrc ? (
        <Box
          component="iframe"
          ref={iframeRef}
          title={title}
          src={iframeSrc}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
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
            Loading {title.toLowerCase()}...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// TODO: LessonsApp should also emit `postMessage({ type: "navigate", url })`
// on internal link clicks and `{ type: "autoPrint" }` from print flows via
// `window.parent` (not only `ReactNativeWebView`). Until those fire on web,
// this listener can't intercept cross-origin navigation inside the iframe.
