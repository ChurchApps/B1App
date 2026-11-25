// "Embed on your own website": a church lists the domains of its own site in the public content setting
// embedDomains, and the /embed/* routes may then be framed from those domains.
//
// SECURITY: embedFrameAncestors() output is written into the Content-Security-Policy response header, and the
// setting is free text any staff member with settings access can save. Only hostnames that pass HOST_PATTERN
// are emitted, each as exactly two fixed-shape sources, so nothing in the setting can end the directive
// (";", ","), add another source (whitespace), or widen it (a scheme, "*", 'unsafe-…' keywords).
// B1Admin validates its input with a copy of parseEmbedDomains (B1Admin/src/helpers/embedDomains.ts); keep them in step.

export const MAX_EMBED_DOMAINS = 10;
const MAX_HOST_LENGTH = 100;
// Bounds the work a huge or hostile setting can cost per request.
const MAX_TOKENS = 50;

// Labels of a-z, 0-9 and "-" that neither start nor end with "-", at least one dot, and a last label that
// starts with a letter (which also rules out IP addresses).
const LABEL = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
const HOST_PATTERN = new RegExp("^(?:" + LABEL + "\\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])$");

export interface EmbedDomains {
  /** Accepted hostnames: lowercased, no scheme, port, path or leading "www.", de-duplicated, at most MAX_EMBED_DOMAINS. */
  hosts: string[];
  /** Entries that are not a plain hostname. */
  rejected: string[];
  /** Valid hostnames dropped because the list was already full. */
  overLimit: string[];
}

const toHost = (token: string): string | null => {
  if (token.length > MAX_HOST_LENGTH * 3) return null;
  const host = token.toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
  return host.length <= MAX_HOST_LENGTH && HOST_PATTERN.test(host) ? host : null;
};

export const parseEmbedDomains = (raw: unknown): EmbedDomains => {
  const result: EmbedDomains = { hosts: [], rejected: [], overLimit: [] };
  if (typeof raw !== "string") return result;
  let examined = 0;
  for (const [token] of raw.matchAll(/[^\s,]+/g)) {
    if (++examined > MAX_TOKENS) break;
    const host = toHost(token);
    if (!host) {
      const shown = token.length > 60 ? token.slice(0, 60) + "…" : token;
      if (!result.rejected.includes(shown)) result.rejected.push(shown);
    } else if (result.hosts.includes(host) || result.overLimit.includes(host)) continue;
    else if (result.hosts.length < MAX_EMBED_DOMAINS) result.hosts.push(host);
    else result.overLimit.push(host);
  }
  return result;
};

// The church's site and its subdomains, over https only.
export const embedFrameAncestors = (raw: unknown): string[] => parseEmbedDomains(raw).hosts.flatMap((host) => ["https://" + host, "https://*." + host]);

// The only paths served with the relaxed frame policy. Matched exactly rather than by prefix: any other
// /embed/… path falls through to the public site's [pageSlug]/[id] route, which must keep the default policy.
const EMBED_PATHS = [/^\/embed\/donate\/?$/, /^\/embed\/forms\/[^/]+\/?$/, /^\/embed\/calendar\/[^/]+\/?$/];

export const isEmbedPath = (pathname: string) => EMBED_PATHS.some((re) => re.test(pathname));

// "Disable Public Website" hides the embed routes too until the church lists a website: before that nothing may
// frame them, so they are just public pages. frameAncestors is the church's embedFrameAncestors() output.
export const isEmbedServedOnHiddenSite = (pathname: string, frameAncestors: string[]) => isEmbedPath(pathname) && frameAncestors.length > 0;
