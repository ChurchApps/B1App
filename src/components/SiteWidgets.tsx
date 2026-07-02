"use client";

import { AnnouncementBanner, Launcher, parseAnnouncementConfig, parseLauncherConfig } from "@churchapps/apphelper/website";

type Props = {
  announcementRaw?: string | null;
  launcherRaw?: string | null;
};

export function SiteWidgets({ announcementRaw, launcherRaw }: Props) {
  const announcement = parseAnnouncementConfig(announcementRaw ?? null);
  const launcher = parseLauncherConfig(launcherRaw ?? null);

  return (
    <>
      {announcement && <AnnouncementBanner config={announcement} />}
      {launcher && <Launcher config={launcher} />}
    </>
  );
}
