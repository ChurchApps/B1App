export const ALLOWED_SCRIPT_HOSTS = ["www.googletagmanager.com", "www.google-analytics.com"] as const;

const MEASUREMENT_ID_RE = /^(?:G|GTM)-[A-Z0-9-]+$/;
const MEASUREMENT_ID_FIND_RE = /\b((?:G|GTM)-[A-Z0-9-]+)\b/g;
const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const ATTR_RE = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>=]+)))?/g;

export type AllowedExternalScript = { src: string; async: boolean; defer: boolean };

export type ParsedCustomJs = { externalScripts: AllowedExternalScript[]; measurementIds: string[] };

export const isAllowedMeasurementId = (id: string): boolean => MEASUREMENT_ID_RE.test(id);

export const isAllowedScriptSrc = (src: string): boolean => {
  try {
    const url = new URL(src.trim());
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    return (ALLOWED_SCRIPT_HOSTS as readonly string[]).includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
};

const parseHtmlAttrs = (attrStr: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(attrStr)) !== null) {
    const name = m[1].toLowerCase();
    if (name === "/" || name.startsWith("on")) continue;
    attrs[name] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
};

const uniqueIds = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!isAllowedMeasurementId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
};

const findMeasurementIds = (text: string): string[] => {
  const ids: string[] = [];
  MEASUREMENT_ID_FIND_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MEASUREMENT_ID_FIND_RE.exec(text)) !== null) ids.push(m[1]);
  return uniqueIds(ids);
};

const idFromSrc = (src: string): string | undefined => {
  try {
    const id = new URL(src).searchParams.get("id") || "";
    return isAllowedMeasurementId(id) ? id : undefined;
  } catch {
    return undefined;
  }
};

const GTAG_BOOTSTRAP_PATTERNS = [
  /window\.dataLayer\s*=\s*window\.dataLayer\s*\|\|\s*\[\s*\]\s*;?/g,
  /var\s+dataLayer\s*=\s*(?:window\.)?dataLayer\s*\|\|\s*\[\s*\]\s*;?/g,
  /function\s+gtag\s*\(\s*\)\s*\{\s*(?:window\.)?dataLayer\.push\(arguments\)\s*;?\s*\}/g,
  /window\.gtag\s*=\s*function\s*\(\s*\)\s*\{\s*(?:window\.)?dataLayer\.push\(arguments\)\s*;?\s*\}/g,
  /gtag\s*\(\s*['"]js['"]\s*,\s*new\s+Date\(\s*\)\s*\)\s*;?/g,
  /gtag\s*\(\s*['"]config['"]\s*,\s*['"](?:G|GTM)-[A-Z0-9-]+['"]\s*(?:,\s*\{[\s\S]*?\})?\s*\)\s*;?/g
];

export const isAllowedGtagInline = (code: string): boolean => {
  let s = code.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
  if (!s) return false;
  let prev = "";
  while (s !== prev) {
    prev = s;
    for (const p of GTAG_BOOTSTRAP_PATTERNS) {
      p.lastIndex = 0;
      s = s.replace(p, "");
    }
    s = s.replace(/\s+/g, " ").trim();
  }
  return s === "" && findMeasurementIds(code).length > 0;
};

const GTM_SNIPPET_RE = /^\s*\(function\s*\(\s*w\s*,\s*d\s*,\s*s\s*,\s*l\s*,\s*i\s*\)\s*\{[\s\S]*https:\/\/www\.googletagmanager\.com\/gtm\.js\?id=['"]?\s*\+\s*i[\s\S]*\}\)\s*\(\s*window\s*,\s*document\s*,\s*['"]script['"]\s*,\s*['"]dataLayer['"]\s*,\s*['"](GTM-[A-Z0-9-]+)['"]\s*\)\s*;?\s*$/;

export const isAllowedGtmInline = (code: string): boolean => {
  const s = code.replace(/<!--[\s\S]*?-->/g, "").trim();
  if (!GTM_SNIPPET_RE.test(s)) return false;
  const urls = s.match(/https?:\/\/[^\s'"+]+/gi) || [];
  return urls.every((u) => {
    try {
      return new URL(u).hostname.toLowerCase() === "www.googletagmanager.com";
    } catch {
      return false;
    }
  });
};

export const parseCustomJs = (html: string): ParsedCustomJs => {
  const externalScripts: AllowedExternalScript[] = [];
  const measurementIds: string[] = [];
  if (!html) return { externalScripts, measurementIds };

  SCRIPT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SCRIPT_RE.exec(html)) !== null) {
    const attrs = parseHtmlAttrs(m[1] || "");
    const src = (attrs.src || "").trim();
    const body = m[2] || "";
    if (src) {
      if (!isAllowedScriptSrc(src)) continue;
      externalScripts.push({ src, async: Object.prototype.hasOwnProperty.call(attrs, "async"), defer: Object.prototype.hasOwnProperty.call(attrs, "defer") });
      const fromSrc = idFromSrc(src);
      if (fromSrc) measurementIds.push(fromSrc);
      continue;
    }
    if (isAllowedGtagInline(body) || isAllowedGtmInline(body)) measurementIds.push(...findMeasurementIds(body));
  }

  return { externalScripts, measurementIds: uniqueIds(measurementIds) };
};

export const gtagLoaderSrc = (id: string): string | null => {
  if (!isAllowedMeasurementId(id)) return null;
  if (id.startsWith("GTM-")) return "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(id);
  return "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
};

// Hostnames an @import may point at. Keep in sync with STYLE_SRC_HOSTS in
// contentSecurityPolicy.ts — CSP blocks anything else anyway, so allowing more
// here would only produce stylesheets that silently fail to load.
export const ALLOWED_STYLE_IMPORT_HOSTS = ["fonts.googleapis.com"] as const;

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
