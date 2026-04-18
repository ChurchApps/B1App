"use client";

import React, { useEffect, useState } from "react";
import { Box, Icon, Typography } from "@mui/material";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

interface StreamConfig {
  churchId?: string;
  keyName?: string;
  services?: Array<{
    videoUrl?: string;
    provider?: string;
    providerKey?: string;
    label?: string;
  }>;
}

const toEmbedUrl = (provider?: string, providerKey?: string, videoUrl?: string): string | null => {
  const p = (provider || "").toLowerCase();
  if (providerKey) {
    if (p === "youtube_live" || p === "youtube") {
      return `https://www.youtube.com/embed/${providerKey}?autoplay=1&rel=0`;
    }
    if (p === "vimeo" || p === "vimeo_live") {
      return `https://player.vimeo.com/video/${providerKey}?autoplay=1`;
    }
  }
  if (videoUrl) return videoUrl;
  return null;
};

export const StreamPage = ({ config }: Props) => {
  const tc = mobileTheme.colors;
  const keyName = config?.church?.subDomain;
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!keyName) { setLoading(false); setOffline(true); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${EnvironmentHelper.Common.ContentApi}/preview/data/${keyName}`);
        if (!res.ok) throw new Error("Stream config fetch failed");
        const data: StreamConfig = await res.json();
        if (cancelled) return;
        const service = Array.isArray(data.services) ? data.services[0] : undefined;
        const url = toEmbedUrl(service?.provider, service?.providerKey, service?.videoUrl);
        if (url) {
          setEmbedUrl(url);
          setOffline(false);
        } else {
          setOffline(true);
        }
      } catch (err) {
        console.error("Failed to load stream config", err);
        if (!cancelled) setOffline(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [keyName]);

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc.text, mb: 2 }}>
        Live Stream
      </Typography>

      <Box sx={{
        position: "relative",
        width: "100%",
        paddingTop: "56.25%",
        borderRadius: `${mobileTheme.radius.xl}px`,
        overflow: "hidden",
        boxShadow: mobileTheme.shadows.md,
        bgcolor: "#000000",
      }}>
        {loading ? (
          <Box sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Typography sx={{ color: "#FFFFFF", opacity: 0.8, fontSize: 14 }}>
              Loading stream...
            </Typography>
          </Box>
        ) : embedUrl ? (
          <Box
            component="iframe"
            title="Live Stream"
            src={embedUrl}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        ) : (
          <Box sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            textAlign: "center",
          }}>
            <Icon sx={{ fontSize: 48, color: "#FFFFFF", opacity: 0.8, mb: 1 }}>live_tv</Icon>
            <Typography sx={{ color: "#FFFFFF", fontSize: 16, fontWeight: 600, mb: 0.5 }}>
              We're not live right now
            </Typography>
            <Typography sx={{ color: "#FFFFFF", opacity: 0.8, fontSize: 14 }}>
              Check back during service times.
            </Typography>
          </Box>
        )}
      </Box>

      {!loading && !offline && (
        <Typography sx={{ mt: 2, fontSize: 12, color: tc.textMuted, textAlign: "center" }}>
          Having trouble? Make sure your browser allows autoplay and third-party video.
        </Typography>
      )}
    </Box>
  );
};
