"use client";

import { useEffect } from "react";
import { isEmbedPath } from "@/helpers/embed";

// Only /embed/* pages may render in the host website's frame; any other B1 page is refused by the browser and
// would leave the frame blank, and another site may refuse too. So every link that leaves the embed opens in a
// new tab. Set in the capture phase, before next/link decides whether to route the click inside the frame.
export function EmbedLinkGuard() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      // mailto:, tel: and downloads never replace the framed page.
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download") || !/^https?:$/.test(anchor.protocol)) return;
      if (anchor.origin === window.location.origin && isEmbedPath(anchor.pathname)) return;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
