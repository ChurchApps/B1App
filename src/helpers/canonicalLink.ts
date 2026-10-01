// Hosts that serve B1App but are not a church's public address (staging/demo tenants are noindexed separately by the caller): canonicals there would point search engines at the wrong site.
const NON_CHURCH_HOSTS = ["localhost", "b1.church"];
const NON_CHURCH_SUFFIXES = [".vercel.app", ".up.railway.app", ".localhost"];
// Mirrors the robots.txt disallow list plus the generated files, which are not pages.
const SKIPPED_PATHS = [/^\/mobile(\/|$)/, /^\/login\/?$/, /^\/logout\/?$/, /^\/robots\.txt$/, /^\/sitemap\.xml$/, /^\/manifest\.webmanifest$/];

// A Link response header (RFC 8288), set in middleware: the host is known there for subdomains and custom domains alike,
// and reading it in generateMetadata would force every page to render dynamically.
export function canonicalLink(hostHeader: string | null | undefined, proto: string, pathname: string): string | null {
  const host = (hostHeader || "").split(",")[0].trim().toLowerCase();
  const hostname = host.split(":")[0];
  if (!hostname || NON_CHURCH_HOSTS.includes(hostname) || NON_CHURCH_SUFFIXES.some((s) => hostname.endsWith(s))) return null;
  if (SKIPPED_PATHS.some((re) => re.test(pathname))) return null;
  return "<" + proto + "://" + host + pathname + ">; rel=\"canonical\"";
}
