// Content-Security-Policy for church-facing B1App responses.
//
// script-src carries a per-request nonce issued by middleware instead of
// 'unsafe-inline'. Next injects that nonce into its own bootstrap/streaming
// scripts and into <Script> tags, so first-party JS still runs while anything
// injected into the HTML (church customJS, stored XSS) does not.
//
// style-src keeps 'unsafe-inline'. A nonce cannot authorize a style *attribute*,
// and React/MUI set element style props all over the app, so dropping it would
// break rendering rather than harden it. customCss is sanitized in Theme before
// it reaches the page; @import is limited to STYLE_SRC_HOSTS.
//
// frame-ancestors lists the Lessons/B1 embedders instead of X-Frame-Options:
// DENY because church sites are legitimately framed by Lessons and B1.
// frame-src stays broad (https:) because WebsiteUrlPage, stream interaction
// tabs, and sermon videoUrl embed church-chosen URLs.

export const SCRIPT_SRC_HOSTS = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://js.stripe.com",
  "https://www.google.com",
  "https://www.gstatic.com"
] as const;

export const STYLE_SRC_HOSTS = ["https://fonts.googleapis.com"] as const;

export const FONT_SRC_HOSTS = ["https://fonts.gstatic.com", "https://storage.googleapis.com"] as const;

export const CONNECT_SRC_HOSTS = [
  "https://*.churchapps.org",
  "https://*.b1.church",
  "https://*.lessons.church",
  "https://lessons.church",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://analytics.google.com",
  "https://*.analytics.google.com",
  "https://www.googletagmanager.com",
  "https://*.googletagmanager.com",
  "https://*.ingest.us.sentry.io",
  "https://*.sentry.io",
  "https://*.stripe.com",
  "https://api.youversion.com",
  "https://*.youversion.com",
  "https://www.google.com",
  "https://www.gstatic.com",
  "wss://*.churchapps.org",
  "wss://*.b1.church"
] as const;

export const FRAME_ANCESTORS = [
  "'self'",
  "https://*.b1.church",
  "https://b1.church",
  "https://*.churchapps.org",
  "https://churchapps.org",
  "https://lessons.church",
  "https://*.lessons.church"
] as const;

export const FORM_ACTION = ["'self'", "https://*.churchapps.org", "https://*.stripe.com"] as const;

// next dev compiles with eval-based source maps and talks to the local API /
// websocket stack on other ports. Those relaxations never ship to production.
const DEV_SCRIPT_SRC = ["'unsafe-eval'"];
const DEV_CONNECT_SRC = ["http://localhost:*", "http://127.0.0.1:*", "http://*.localtest.me:*", "ws://localhost:*", "ws://127.0.0.1:*", "ws://*.localtest.me:*"];

export interface CspOptions {
  nonce?: string;
  dev?: boolean;
}

export const buildContentSecurityPolicy = (options: CspOptions = {}): string => {
  const { nonce, dev = false } = options;

  const scriptSrc = ["'self'", ...(nonce ? [`'nonce-${nonce}'`] : []), ...SCRIPT_SRC_HOSTS, ...(dev ? DEV_SCRIPT_SRC : [])];
  const connectSrc = ["'self'", ...CONNECT_SRC_HOSTS, ...(dev ? DEV_CONNECT_SRC : [])];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: " + FONT_SRC_HOSTS.join(" "),
    "style-src 'self' 'unsafe-inline' " + STYLE_SRC_HOSTS.join(" "),
    "script-src " + scriptSrc.join(" "),
    "connect-src " + connectSrc.join(" "),
    "frame-src 'self' https:",
    "frame-ancestors " + FRAME_ANCESTORS.join(" "),
    "worker-src 'self' blob:",
    "media-src 'self' blob: https:",
    "form-action " + FORM_ACTION.join(" ")
  ].join("; ");
};

// base64 per the CSP nonce-source grammar; 128 bits of entropy per response.
export const generateNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};
