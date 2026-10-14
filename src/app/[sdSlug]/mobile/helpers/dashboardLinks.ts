import { type LinkInterface } from "@churchapps/helpers";
import { linkTypeToRoute } from "../components/mobileTheme";

export const LINK_VIEW_COUNTS_KEY = "b1app-link-view-counts";

export const linkId = (link: LinkInterface): string => link.id || `${link.linkType}_${link.text}`;

// "url" links (and any absolute route) leave the app in a new tab.
export const linkTarget = (link: LinkInterface): { href: string; external: boolean } | null => {
  const href = linkTypeToRoute(link.linkType, link.linkData, link.text, link.url);
  if (!href) return null;
  return { href, external: link.linkType === "url" || /^https?:/.test(href) };
};

export const openExternal = (href: string) => {
  const target = /^https?:/.test(href) ? href : new URL(href, window.location.origin).toString();
  window.open(target, "_blank", "noopener,noreferrer");
};
