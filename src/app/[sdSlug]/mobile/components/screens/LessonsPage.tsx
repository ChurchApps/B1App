"use client";

import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";
import { ApiHelper, Locale, UserHelper } from "@churchapps/apphelper";
import type { LinkInterface, LoginResponseInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { useChurchLinks } from "../../hooks/useConfig";
import { mobileTheme } from "../mobileTheme";
import { PageHead, Plate, PlateSection, QuietEmpty } from "../kit";

const INTERNAL_ROUTE_MAP: Array<{ match: RegExp; to: (m: RegExpMatchArray) => string }> = [
  { match: /\/my\/groups(?:\/|$|\?)/, to: () => "/mobile/groups" },
  { match: /\/my\/plans(?:\/|$|\?)/, to: () => "/mobile/plans" },
  { match: /\/my\/community(?:\/|$|\?)/, to: () => "/mobile/community" },
  { match: /\/my\/checkin(?:\/|$|\?)/, to: () => "/mobile/checkin" },
  { match: /\/groups\/details\/([\w-]+)/, to: (m) => `/mobile/groups/${m[1]}` },
  { match: /\/votd(?:\/|$|\?)/, to: () => "/mobile/votd" },
  { match: /\/donate(?:\/|$|\?)/, to: () => "/mobile/donate" }
];

const resolveInternalRoute = (url: string): string | null => {
  try {

    const path = url.startsWith("http") ? new URL(url).pathname + new URL(url).search : url;
    for (const entry of INTERNAL_ROUTE_MAP) {
      const m = path.match(entry.match);
      if (m) return entry.to(m);
    }
  } catch {

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

  const jwt = context?.userChurch?.jwt;
  const churchId = context?.userChurch?.church?.id;

  const { data: rawLinks } = useChurchLinks(churchId, jwt);
  const linkTitle = useMemo(() => {
    if (!Array.isArray(rawLinks)) return null;
    const lessonsLink = (rawLinks as LinkInterface[]).find(
      (l) => (l.linkType || "").toLowerCase() === "lessons"
    );
    return lessonsLink?.text || null;
  }, [rawLinks]);
  const title = linkTitle || Locale.label("mobile.screens.lessons");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const iframeSrc =
    jwt && churchId
      ? `${EnvironmentHelper.Common.LessonsRoot}/login?returnUrl=/b1/person&churchId=${churchId}#jwt=${encodeURIComponent(jwt)}`
      : null;

  const reauthenticate = async () => {
    try {
      if (!jwt) return;
      const resp: LoginResponseInterface = await ApiHelper.postAnonymous(
        "/users/login",
        { jwt },
        "MembershipApi"
      );
      if (resp?.user) {
        ApiHelper.setDefaultPermissions(resp.user.jwt || "");
        UserHelper.user = resp.user;
        UserHelper.userChurches = resp.userChurches || [];
        const current = (resp.userChurches || []).find(
          (uc: any) => uc.church?.id === churchId
        );
        if (current) {
          UserHelper.currentUserChurch = current;
          UserHelper.setupApiHelper(current);
          context?.setUser(resp.user);
          context?.setUserChurches(resp.userChurches || []);
          context?.setUserChurch(current);
        }
      }
    } catch (err) {
      console.warn("LessonsPage: profile re-auth failed", err);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {

      try {
        const lessonsOrigin = new URL(EnvironmentHelper.Common.LessonsRoot).origin;
        if (event.origin && event.origin !== lessonsOrigin) return;
      } catch {

      }

      const data: any = event.data;
      if (!data) return;

      const type =
        typeof data === "string"
          ? data
          : data.type || data.event || data.message || null;

      if (type === "profile_updated") {
        void reauthenticate();
        return;
      }
      if (type === "profile_deleted") {

        window.location.href = "/mobile/logout";
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

      if (type === "navigate" && typeof data?.url === "string") {
        const route = resolveInternalRoute(data.url);
        if (route) router.push(route);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => { window.removeEventListener("message", handleMessage); };

  }, [jwt, churchId]);

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

    if (iframeRef.current && iframeSrc) {
      iframeRef.current.src = iframeSrc;
    }
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    loadTimeoutRef.current = setTimeout(() => {
      if (!iframeLoaded) setIframeError(true);
    }, 15000);
  };

  const head = <PageHead title={title} sx={{ pb: { xs: "12px", md: "16px" } }} />;

  if (!jwt || !churchId) {
    return (
      <Box>
        {head}
        <Plate>
          <PlateSection>
            <Typography component="h2" sx={{ fontSize: 17, fontWeight: 650, color: tc.text }}>
              {Locale.label("mobile.screens.signInToView").replace("{}", title.toLowerCase())}
            </Typography>
            <QuietEmpty sx={{ mt: "4px", mb: "16px" }}>
              {Locale.label("mobile.screens.signInToViewBody").replace("{}", title)}
            </QuietEmpty>
            <Button variant="contained" href="/mobile/login?returnUrl=/mobile/lessons" data-testid="lessons-signin-button">
              {Locale.label("mobile.screens.signIn")}
            </Button>
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  if (iframeError) {
    return (
      <Box>
        {head}
        <Plate>
          <PlateSection>
            <Typography component="h2" sx={{ fontSize: 17, fontWeight: 650, color: tc.text }}>
              {Locale.label("mobile.lessons.unableToLoad").replace("{}", title.toLowerCase())}
            </Typography>
            <QuietEmpty sx={{ mt: "4px", mb: "16px" }}>{Locale.label("mobile.details.checkConnection")}</QuietEmpty>
            <Button variant="contained" onClick={handleRetry} data-testid="lessons-retry-button">
              {Locale.label("mobile.screens.retry")}
            </Button>
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  return (
    <Box>
      {head}
      <Plate sx={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
              display: "block",
              minHeight: { xs: "calc(100dvh - 220px)", md: "calc(100dvh - 200px)" },
              border: 0,
              bgcolor: tc.surface
            }}
          />
        ) : (
          <PlateSection>
            <QuietEmpty>{Locale.label("mobile.lessons.loading").replace("{}", title.toLowerCase())}</QuietEmpty>
          </PlateSection>
        )}
      </Plate>
    </Box>
  );
};
