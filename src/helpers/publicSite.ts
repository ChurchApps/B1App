// A church with the "Disable Public Website" setting (hidePublicSite) keeps only these paths reachable:
// login/logout, the member portal, event and guest registration links, the manifest/robots/sitemap routes,
// and the embed routes (a church that keeps its own website is exactly who embeds B1 pages in it).
const PUBLIC_SITE_ALLOWLIST = [
  /^\/login\/?$/, /^\/logout\/?$/, /^\/mobile(\/|$)/, /^\/register\//, /^\/guest-register\/?$/, /^\/embed\//, /^\/manifest\.webmanifest$/, /^\/robots\.txt$/, /^\/sitemap\.xml$/
];

export const isAllowedWhenPublicSiteHidden = (pathname: string) => PUBLIC_SITE_ALLOWLIST.some((re) => re.test(pathname));

export const isPublicSiteHidden = (settings: { hidePublicSite?: string } | null | undefined) => settings?.hidePublicSite === "true";
