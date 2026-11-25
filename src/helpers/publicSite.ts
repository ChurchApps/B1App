// A church with the "Disable Public Website" setting (hidePublicSite) keeps only these paths reachable:
// login/logout, the member portal, event and guest registration links, and the manifest/robots/sitemap routes.
const PUBLIC_SITE_ALLOWLIST = [
  /^\/login\/?$/, /^\/logout\/?$/, /^\/mobile(\/|$)/, /^\/register\//, /^\/guest-register\/?$/, /^\/manifest\.webmanifest$/, /^\/robots\.txt$/, /^\/sitemap\.xml$/
];

export const isAllowedWhenPublicSiteHidden = (pathname: string) => PUBLIC_SITE_ALLOWLIST.some((re) => re.test(pathname));

export const isPublicSiteHidden = (settings: { hidePublicSite?: string } | null | undefined) => settings?.hidePublicSite === "true";
