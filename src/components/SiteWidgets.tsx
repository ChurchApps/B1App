"use client";

import { useEffect, useRef } from "react";
import { AnnouncementBanner, Launcher, parseAnnouncementConfig, parseLauncherConfig } from "@churchapps/apphelper/website";

type Props = {
  announcementRaw?: string | null;
  launcherRaw?: string | null;
};

const HEIGHT_VAR = "--announcement-bar-height";
const setBarHeight = (px: number) => document.documentElement.style.setProperty(HEIGHT_VAR, px + "px");

export function SiteWidgets({ announcementRaw, launcherRaw }: Props) {
  const announcement = parseAnnouncementConfig(announcementRaw ?? null);
  const launcher = parseLauncherConfig(launcherRaw ?? null);
  const bannerWrapper = useRef<HTMLDivElement>(null);

  // The fixed nav bar (Header) sits at top: var(--announcement-bar-height), so publish the bar's height.
  useEffect(() => {
    const bar = bannerWrapper.current?.querySelector(".announcement-banner");
    if (!bar) { setBarHeight(0); return; }
    const observer = new ResizeObserver(() => setBarHeight(bar.isConnected ? bar.getBoundingClientRect().height : 0));
    observer.observe(bar);
    return () => { observer.disconnect(); document.documentElement.style.removeProperty(HEIGHT_VAR); };
  }, [announcementRaw]);

  return (
    <>
      {/* display: contents keeps the sticky banner's containing block the page body. */}
      {announcement && <div ref={bannerWrapper} style={{ display: "contents" }}><AnnouncementBanner config={announcement} onDismiss={() => setBarHeight(0)} /></div>}
      {launcher && <Launcher config={launcher} />}
    </>
  );
}
