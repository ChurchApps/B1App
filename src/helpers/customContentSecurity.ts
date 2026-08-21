// customJS is deliberately NOT filtered: churches may run arbitrary JS on their
// own sites (Theme.tsx re-executes it; CSP 'strict-dynamic' permits it).
// Only customCss and interpolated-into-script values are validated here.

// ga4MeasurementId gets interpolated into an inline script (ChurchAnalytics),
// so it must stay shape-validated.
export const isAllowedMeasurementId = (id: string): boolean => /^(?:G|GTM)-[A-Z0-9-]+$/.test(id);

// Hostnames an @import may point at. Keep in sync with STYLE_SRC_HOSTS in
// contentSecurityPolicy.ts — CSP blocks anything else anyway, so allowing more
// here would only produce stylesheets that silently fail to load.
export const ALLOWED_STYLE_IMPORT_HOSTS = ["fonts.googleapis.com", "cdnjs.cloudflare.com", "use.fontawesome.com"] as const;

const CSS_STRIP_PATTERNS = [
  /<\/?[a-zA-Z][^>]*>/g, // HTML tags
  /<\/style/gi, // unterminated </style breakout
  /expression\s*\(/gi, // legacy IE expression()
  /-moz-binding/gi, // XBL binding
  /behavior\s*:/gi, // IE behavior:
  /url\s*\(\s*['"]?\s*javascript\s*:/gi
];

const importHref = (stmt: string): string =>
  (stmt.match(/url\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/i) || stmt.match(/@import\s+['"]([^'"]+)['"]/i))?.[1] || "";

const isAllowedCssImport = (stmt: string): boolean => {
  const href = importHref(stmt);
  if (!href) return false;
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    return (ALLOWED_STYLE_IMPORT_HOSTS as readonly string[]).includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
};

export const sanitizeCustomCss = (css: string): string => {
  if (!css) return "";
  let out = css;
  let prev = "";
  // Loop to a fixed point: a single pass lets nested payloads such as
  // "expexpression(ression(" reassemble into the very token being stripped.
  while (out !== prev) {
    prev = out;
    for (const pattern of CSS_STRIP_PATTERNS) {
      pattern.lastIndex = 0;
      out = out.replace(pattern, "");
    }
    out = out.replace(/@import\b[^;]*;?/gi, (stmt) => (isAllowedCssImport(stmt) ? stmt : ""));
  }
  return out;
};
