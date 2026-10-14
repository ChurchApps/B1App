"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Button, CircularProgress } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Locale } from "@churchapps/apphelper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { PageHead, Plate, PlateSection, QuietEmpty, TextLink } from "../kit";

interface Props {
  config: ConfigurationInterface;
}

const INTERNAL_PATH_MAP: Array<{ match: RegExp; build: (id?: string) => string }> = [
  { match: /^\/donate\/?$/, build: () => "/mobile/donate" },
  { match: /^\/votd\/?$/, build: () => "/mobile/votd" },
  { match: /^\/my\/checkin\/?$/, build: () => "/mobile/checkin" },
  { match: /^\/my\/community\/?$/, build: () => "/mobile/community" },
  { match: /^\/my\/community\/([^/?#]+)\/?$/, build: (id) => `/mobile/community/${id}` },
  { match: /^\/my\/groups\/?$/, build: () => "/mobile/groups" },
  { match: /^\/my\/plans\/?$/, build: () => "/mobile/plans" },
  { match: /^\/my\/plans\/([^/?#]+)\/?$/, build: (id) => `/mobile/plans/${id}` },
  { match: /^\/groups\/details\/([^/?#]+)\/?$/, build: (id) => `/mobile/groups/${id}` }
];

const resolveInternalPath = (rawUrl: string): string | null => {
  try {
    const parsed = new URL(rawUrl, typeof window !== "undefined" ? window.location.href : "http://localhost/");

    if (typeof window !== "undefined" && parsed.origin !== window.location.origin) return null;
    const path = parsed.pathname;
    if (path.startsWith("/mobile/")) return path;
    for (const entry of INTERNAL_PATH_MAP) {
      const m = path.match(entry.match);
      if (m) return entry.build(m[1]);
    }
    return null;
  } catch {
    return null;
  }
};

const IFRAME_LOAD_TIMEOUT_MS = 15000;

export const WebsiteUrlPage = ({ config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const isPage = (pathname || "").includes("/mobile/page");
  const rawUrl = params?.get("url") || "";
  const rawId = params?.get("id") || "";
  const title = params?.get("title") || Locale.label("mobile.screens.website");

  const resolvedUrl = useMemo(() => {
    if (isPage) {
      if (!rawId) return "";
      if (typeof window === "undefined") return "";
      const slug = rawId.startsWith("/") ? rawId : `/${rawId}`;
      return `${window.location.origin}${slug}`;
    }
    if (!rawUrl) return "";
    try {
      const parsed = new URL(rawUrl, typeof window === "undefined" ? "https://b1.church" : window.location.href);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
      return parsed.href;
    } catch {
      return "";
    }
  }, [isPage, rawId, rawUrl]);

  const isCrossOrigin = useMemo(() => {
    if (!resolvedUrl) return false;
    if (typeof window === "undefined") return false;
    try {
      const parsed = new URL(resolvedUrl, window.location.href);
      return parsed.origin !== window.location.origin;
    } catch {
      return false;
    }
  }, [resolvedUrl]);

  const externalHost = useMemo(() => {
    if (!resolvedUrl) return "";
    try {
      return new URL(resolvedUrl, typeof window !== "undefined" ? window.location.href : "http://localhost/").host;
    } catch {
      return resolvedUrl;
    }
  }, [resolvedUrl]);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: MessageEvent) => {

      if (event.origin !== window.location.origin) return;
      const data: any = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type !== "navigate" || typeof data.url !== "string") return;
      const native = resolveInternalPath(data.url);
      if (native) router.push(native);
    };
    window.addEventListener("message", handler);
    return () => { window.removeEventListener("message", handler); };
  }, [router]);

  useEffect(() => {
    if (!resolvedUrl) return;
    setStatus("loading");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {

      setStatus((current) => (current === "loading" ? "error" : current));
    }, IFRAME_LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [resolvedUrl]);

  const handleIframeLoad = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus("ready");
  };

  const handleIframeError = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus("error");
  };

  const handleRetry = () => {
    setStatus("loading");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStatus((current) => (current === "loading" ? "error" : current));
    }, IFRAME_LOAD_TIMEOUT_MS);

    setIframeKey((k) => k + 1);
  };

  const [iframeKey, setIframeKey] = useState(0);

  if (resolvedUrl && isCrossOrigin) {
    return (
      <Box>
        <PageHead title={title} lede={<Box component="span" sx={{ overflowWrap: "anywhere" }}>{externalHost}</Box>}>
          <Button variant="contained" href={resolvedUrl} target="_blank" rel="noopener noreferrer" startIcon={<OpenInNewIcon />}>
            {Locale.label("mobile.screens.openWebsite")}
          </Button>
        </PageHead>
        <Plate>
          <PlateSection>
            <QuietEmpty>{Locale.label("mobile.screens.cantShowInApp")}</QuietEmpty>
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  if (!resolvedUrl) {
    return (
      <Box>
        <PageHead title={title} />
        <Plate>
          <PlateSection>
            <QuietEmpty>{Locale.label("mobile.screens.noUrlProvided")}</QuietEmpty>
          </PlateSection>
        </Plate>
      </Box>
    );
  }

  return (
    <Box>
      <PageHead title={title} sx={{ pb: { xs: "12px", md: "16px" } }}>
        <TextLink aria-label={Locale.label("mobile.screens.openInNewTab")} onClick={() => window.open(resolvedUrl, "_blank", "noopener,noreferrer")}>
          <OpenInNewIcon sx={{ fontSize: 18 }} />{Locale.label("mobile.screens.openInNewTab")}
        </TextLink>
      </PageHead>
      <Plate sx={{ overflow: "hidden", position: "relative", height: { xs: "calc(100dvh - 220px)", md: "calc(100dvh - 200px)" }, minHeight: 360 }}>
        <Box
          key={iframeKey}
          component="iframe"
          src={resolvedUrl}
          title={title}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sx={{
            width: "100%",
            height: "100%",
            border: 0,
            bgcolor: tc.surface,
            display: status === "error" ? "none" : "block"
          }}
        />
        {status === "loading" && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: tc.surface, pointerEvents: "none" }}>
            <CircularProgress size={32} sx={{ color: tc.primary }} />
          </Box>
        )}
        {status === "error" && (
          <PlateSection>
            <QuietEmpty sx={{ fontWeight: 600, color: tc.text }}>{Locale.label("mobile.screens.unableToLoadPage")}</QuietEmpty>
            <QuietEmpty sx={{ mb: "16px" }}>{Locale.label("mobile.screens.unableToLoadPageBody")}</QuietEmpty>
            <Button variant="contained" onClick={handleRetry}>{Locale.label("mobile.screens.retry")}</Button>
          </PlateSection>
        )}
      </Plate>
    </Box>
  );
};

export default WebsiteUrlPage;
