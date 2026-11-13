"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import { AnnouncementBanner, parseAnnouncementConfig } from "@churchapps/apphelper/website";
import type { LinkInterface } from "@churchapps/helpers";
import { linkTypeToRoute } from "./mobileTheme";

interface Props {
  raw?: string;
  navLinks?: LinkInterface[];
}

// Keeps the banner's link inside the app: "/food" opens the Food page screen (with the tab's title)
// instead of loading the website over the app. Other sites' links are left as they are.
export const mobileAnnouncementHref = (linkUrl: string, navLinks: LinkInterface[] = []): string => {
  const url = linkUrl.trim();
  if (!url.startsWith("/") || url.startsWith("//") || url.startsWith("/mobile")) return url;
  const path = url.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const tab = navLinks.find((l) => l.linkType === "page" && (l.url || l.linkData || "").replace(/\/+$/, "") === path);
  if (tab) return linkTypeToRoute(tab.linkType, tab.linkData, tab.text, tab.url, tab.id) || url;
  return `/mobile/page?id=${encodeURIComponent(url)}`;
};

// The website's Announcement Bar (B1 Admin > Site > Appearance), shown above Welcome on the app's Home screen.
export const MobileAnnouncementBar = ({ raw, navLinks }: Props) => {
  const router = useRouter();
  const config = useMemo(() => {
    const parsed = parseAnnouncementConfig(raw ?? null);
    if (!parsed?.linkUrl) return parsed;
    return { ...parsed, linkUrl: mobileAnnouncementHref(parsed.linkUrl, navLinks) };
  }, [raw, navLinks]);

  if (!config) return null;

  const onClick = (e: React.MouseEvent) => {
    const link = (e.target as HTMLElement).closest("a.announcement-banner__link");
    const href = link?.getAttribute("href");
    if (!href?.startsWith("/mobile")) return;
    e.preventDefault();
    router.push(href);
  };

  return (
    <Box
      data-testid="home-announcement-bar"
      onClick={onClick}
      sx={{
        mb: 2,
        "&:empty": { display: "none" },
        "& .announcement-banner": { position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", columnGap: "12px", rowGap: "4px", p: "12px 44px 12px 16px", borderRadius: "10px", textAlign: "center", boxSizing: "border-box", fontSize: 15, lineHeight: 1.35 },
        "& .announcement-banner__text": { fontWeight: 500 },
        "& .announcement-banner__link": { textDecoration: "underline", fontWeight: 600 },
        "& .announcement-banner__close": { position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: 0, fontSize: 24, lineHeight: 1, cursor: "pointer", p: "4px 8px", opacity: 0.85 }
      }}
    >
      <AnnouncementBanner config={config} />
    </Box>
  );
};
