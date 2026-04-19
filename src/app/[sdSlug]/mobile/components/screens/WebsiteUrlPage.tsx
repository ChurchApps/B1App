"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, CircularProgress, Icon, IconButton, Typography } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

// Internal URL paths (as rendered inside the embedded B1 page) mapped to
// their `/mobile/*` equivalents. Matches the native mirror in
// B1Mobile's WebsiteScreen.tsx (`urlToScreenMapping`).
const INTERNAL_PATH_MAP: Array<{ match: RegExp; build: (id?: string) => string }> = [
  { match: /^\/donate\/?$/, build: () => "/mobile/donate" },
  { match: /^\/votd\/?$/, build: () => "/mobile/votd" },
  { match: /^\/my\/checkin\/?$/, build: () => "/mobile/checkin" },
  { match: /^\/my\/community\/?$/, build: () => "/mobile/community" },
  { match: /^\/my\/community\/([^/?#]+)\/?$/, build: (id) => `/mobile/community/${id}` },
  { match: /^\/my\/groups\/?$/, build: () => "/mobile/groups" },
  { match: /^\/my\/plans\/?$/, build: () => "/mobile/plans" },
  { match: /^\/my\/plans\/([^/?#]+)\/?$/, build: (id) => `/mobile/plans/${id}` },
  { match: /^\/groups\/details\/([^/?#]+)\/?$/, build: (id) => `/mobile/groups/${id}` },
];

const resolveInternalPath = (rawUrl: string): string | null => {
  try {
    const parsed = new URL(rawUrl, typeof window !== "undefined" ? window.location.href : "http://localhost/");
    // Only intercept same-origin links; external URLs get left alone.
    if (typeof window !== "undefined" && parsed.origin !== window.location.origin) return null;
    const path = parsed.pathname;
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

  // `/mobile/page` passes the church-authored page slug as `id`; we resolve
  // it against the current origin so the iframe stays within the B1 app host
  // (matching B1Mobile's `B1WebRoot + item.url` behaviour on native).
  // `/mobile/websiteUrl` passes a full external URL as `url`.
  const isPage = (pathname || "").includes("/mobile/page");
  const rawUrl = params?.get("url") || "";
  const rawId = params?.get("id") || "";
  const title = params?.get("title") || "Website";

  const resolvedUrl = useMemo(() => {
    if (isPage) {
      if (!rawId) return "";
      if (typeof window === "undefined") return "";
      const slug = rawId.startsWith("/") ? rawId : `/${rawId}`;
      return `${window.location.origin}${slug}`;
    }
    return rawUrl;
  }, [isPage, rawId, rawUrl]);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/mobile/dashboard");
  };

  // Internal-link interception via postMessage. The embedded B1 page (same
  // origin) can emit `{ type: "navigate", url }` and we'll rewrite
  // recognised internal paths into /mobile/* native routes. If the embedded
  // page doesn't emit these, this is a no-op — follow-up: wire an emitter
  // into the shared page renderer.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: MessageEvent) => {
      // Same-origin guard: only trust messages from the embedded iframe when
      // it's hosted on the same origin as the app shell.
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

  // Loading / error timing. Reset whenever the resolved URL changes.
  useEffect(() => {
    if (!resolvedUrl) return;
    setStatus("loading");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // If we never heard an onLoad in the timeout window, surface an error
      // fallback. (Cross-origin iframes can swallow errors silently.)
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
    // Force an iframe remount via key change.
    setIframeKey((k) => k + 1);
  };

  const [iframeKey, setIframeKey] = useState(0);

  if (!resolvedUrl) {
    return (
      <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.xl}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
          }}
        >
          <Icon sx={{ fontSize: 32, color: tc.primary, mb: 1 }}>link_off</Icon>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text }}>No URL provided</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        bgcolor: tc.background,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: `${mobileTheme.spacing.sm}px`,
          px: `${mobileTheme.spacing.md}px`,
          py: `${mobileTheme.spacing.sm}px`,
          bgcolor: tc.surface,
          borderBottom: `1px solid ${tc.border}`,
        }}
      >
        <IconButton aria-label="Back" onClick={handleBack} sx={{ color: tc.text }}>
          <Icon>arrow_back</Icon>
        </IconButton>
        <Typography
          sx={{
            flex: 1,
            fontSize: 16,
            fontWeight: 600,
            color: tc.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
        <IconButton
          aria-label="Open in new tab"
          onClick={() => window.open(resolvedUrl, "_blank", "noopener,noreferrer")}
          sx={{ color: tc.text }}
        >
          <Icon>open_in_new</Icon>
        </IconButton>
      </Box>
      <Box sx={{ position: "relative", flex: 1, bgcolor: tc.surface }}>
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
            display: status === "error" ? "none" : "block",
          }}
        />
        {status === "loading" && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: tc.surface,
              pointerEvents: "none",
            }}
          >
            <CircularProgress size={32} sx={{ color: tc.primary }} />
          </Box>
        )}
        {status === "error" && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: `${mobileTheme.spacing.md}px`,
              bgcolor: tc.background,
            }}
          >
            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.xl}px`,
                boxShadow: mobileTheme.shadows.sm,
                p: `${mobileTheme.spacing.lg}px`,
                textAlign: "center",
                maxWidth: 320,
                width: "100%",
              }}
            >
              <Icon sx={{ fontSize: 32, color: tc.error, mb: 1 }}>error_outline</Icon>
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
                Unable to load page
              </Typography>
              <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
                The page took too long to respond or could not be displayed.
              </Typography>
              <Box
                component="button"
                onClick={handleRetry}
                sx={{
                  bgcolor: tc.primary,
                  color: tc.onPrimary,
                  border: "none",
                  borderRadius: `${mobileTheme.radius.md}px`,
                  px: 2,
                  py: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Retry
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default WebsiteUrlPage;
