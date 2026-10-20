import axios from "axios";
import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { Readable } from "node:stream";

// Episode files are streamed from the church site, not the Api. The Api response
// limit is a few megabytes and API Gateway does not treat audio as binary, so a
// sermon would be cut off. This server can stream the file and name it.

const MAX_REDIRECTS = 3;
const MAX_BYTES = 250 * 1024 * 1024;

const AUDIO_EXT: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/aac": ".aac",
  "audio/ogg": ".ogg",
  "audio/opus": ".opus",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/flac": ".flac",
  "audio/webm": ".webm"
};

const BLOCKED_HOSTS = new Set(["localhost", "localhost.localdomain", "metadata", "metadata.google.internal", "metadata.google.com"]);
const BLOCKED_SUFFIXES = [
  ".localhost", ".local", ".internal", ".lan", ".home", ".corp", ".private", ".localdomain", ".invalid"
];

const blocked = new BlockList();
blocked.addSubnet("0.0.0.0", 8, "ipv4");
blocked.addSubnet("10.0.0.0", 8, "ipv4");
blocked.addSubnet("100.64.0.0", 10, "ipv4");
blocked.addSubnet("127.0.0.0", 8, "ipv4");
blocked.addSubnet("169.254.0.0", 16, "ipv4");
blocked.addSubnet("172.16.0.0", 12, "ipv4");
blocked.addSubnet("192.0.0.0", 24, "ipv4");
blocked.addSubnet("192.168.0.0", 16, "ipv4");
blocked.addSubnet("198.18.0.0", 15, "ipv4");
blocked.addSubnet("224.0.0.0", 4, "ipv4");
blocked.addAddress("255.255.255.255", "ipv4");
blocked.addAddress("::", "ipv6");
blocked.addAddress("::1", "ipv6");
blocked.addSubnet("64:ff9b::", 96, "ipv6");
blocked.addSubnet("64:ff9b:1::", 48, "ipv6");
blocked.addSubnet("fc00::", 7, "ipv6");
blocked.addSubnet("fe80::", 10, "ipv6");
blocked.addSubnet("ff00::", 8, "ipv6");

export class PodcastDownloadError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface EpisodeRef {
  guid: string;
  title: string;
  audioUrl: string;
  audioType: string;
}

export interface Hop {
  status: number;
  location: string | null;
  contentType: string | null;
  contentLength: number | null;
  body: ReadableStream<Uint8Array> | null;
}

export interface DownloadResult {
  body: ReadableStream<Uint8Array>;
  headers: Record<string, string>;
}

type LookupFn = (hostname: string) => Promise<{ address: string; family?: number }[]>;

export interface DownloadDeps {
  fetchFeed?: (feedUrl: string) => Promise<{ status: number; json: unknown }>;
  fetchHop?: (url: string) => Promise<Hop>;
  lookup?: LookupFn;
}

export function isPrivateAddress(address: string): boolean {
  const raw = address.toLowerCase().replace(/^\[|\]$/g, "");
  const ip = raw.startsWith("::ffff:") ? raw.slice(7) : raw;
  const sixToFour = ip.match(/^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4})/i);
  if (sixToFour) {
    const hi = parseInt(sixToFour[1], 16);
    const lo = parseInt(sixToFour[2], 16);
    return isPrivateAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  if (ip.includes(":")) return isIP(ip) !== 6 || blocked.check(ip, "ipv6");
  return isIP(ip) !== 4 || blocked.check(ip, "ipv4");
}

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
}

function isBlockedHostname(hostname: string): boolean {
  if (!hostname || BLOCKED_HOSTS.has(hostname)) return true;
  if (BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) return true;
  return isIP(hostname) !== 0 && isPrivateAddress(hostname);
}

export function audioExtension(audioType: string, audioUrl: string): string {
  const type = (audioType || "").split(";")[0].trim().toLowerCase();
  if (AUDIO_EXT[type]) return AUDIO_EXT[type];
  try {
    const match = decodeURIComponent(new URL(audioUrl).pathname).match(/(\.[a-z0-9]{2,5})$/i);
    if (match) return match[1].toLowerCase();
  } catch { /* the feed type was missing and the address is not a url */ }
  return ".mp3";
}

export function episodeFilename(title: string, audioType: string, audioUrl: string): string {
  const ext = audioExtension(audioType, audioUrl);
  const base = (title || "").replace(/[\u0000-\u001f\u007f"\\/:*?<>|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "episode";
  return base.toLowerCase().endsWith(ext) ? base : base + ext;
}

function encodeRFC5987(value: string): string {
  return encodeURIComponent(value).replace(/['()*]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase());
}

export function contentDisposition(filename: string): string {
  const safe = filename.replace(/[\r\n"]/g, "");
  const ascii = safe.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeRFC5987(safe)}`;
}

export function pickEpisode(feed: unknown, guid: string): EpisodeRef | null {
  const episodes = feed && typeof feed === "object" ? (feed as { episodes?: unknown }).episodes : undefined;
  if (!Array.isArray(episodes)) return null;
  const found = episodes.find((item) => {
    if (!item || typeof item !== "object") return false;
    const ep = item as { guid?: unknown; audioUrl?: unknown };
    return ep.guid === guid && typeof ep.audioUrl === "string" && ep.audioUrl.trim().length > 0;
  }) as { guid?: unknown; title?: unknown; audioUrl?: unknown; audioType?: unknown } | undefined;
  if (!found || typeof found.audioUrl !== "string") return null;
  return {
    guid: String(found.guid),
    title: typeof found.title === "string" ? found.title : "",
    audioUrl: found.audioUrl.trim(),
    audioType: typeof found.audioType === "string" ? found.audioType : ""
  };
}

async function defaultLookup(hostname: string): Promise<{ address: string; family: number }[]> {
  return dns.lookup(hostname, { all: true });
}

export async function assertPublicUrl(rawUrl: string, lookup: LookupFn = defaultLookup): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new PodcastDownloadError("Episode address is not allowed", 400);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new PodcastDownloadError("Episode address is not allowed", 400);
  if (parsed.username || parsed.password) throw new PodcastDownloadError("Episode address is not allowed", 400);
  const host = normalizeHost(parsed.hostname);
  if (isBlockedHostname(host)) throw new PodcastDownloadError("Episode address is not allowed", 400);
  if (isIP(host) !== 0) return;
  let addresses: { address: string }[] = [];
  try {
    addresses = await lookup(host);
  } catch {
    throw new PodcastDownloadError("Episode address is not allowed", 400);
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) throw new PodcastDownloadError("Episode address is not allowed", 400);
}

const safeLookup: LookupFunction = (hostname, options, callback) => {
  const host = normalizeHost(String(hostname));
  const done = callback as (err: NodeJS.ErrnoException | null, address: string | { address: string; family: number }[], family?: number) => void;
  dns.lookup(host, { all: true }).then((addresses) => {
    if (isBlockedHostname(host) || addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
      done(Object.assign(new Error("Host is not allowed"), { code: "ENETUNREACH" }), "", 4);
      return;
    }
    const want = typeof options === "object" ? options.family : undefined;
    const matches = want === 4 || want === 6 ? addresses.filter((a) => a.family === want) : addresses;
    if (matches.length === 0) {
      done(Object.assign(new Error("Host is not allowed"), { code: "ENETUNREACH" }), "", 4);
      return;
    }
    if (typeof options === "object" && options.all) done(null, matches);
    else done(null, matches[0].address, matches[0].family);
  }).catch((err: NodeJS.ErrnoException) => {
    done(err, "", 4);
  });
};

const httpAgent = new http.Agent({ lookup: safeLookup });
const httpsAgent = new https.Agent({ lookup: safeLookup });

function headerValue(headers: Record<string, unknown>, name: string): string | null {
  const value = headers[name];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

async function defaultFetchHop(url: string): Promise<Hop> {
  try {
    const response = await axios.get(url, {
      responseType: "stream",
      maxRedirects: 0,
      timeout: 180000,
      httpAgent,
      httpsAgent,
      validateStatus: () => true,
      maxContentLength: MAX_BYTES,
      maxBodyLength: MAX_BYTES,
      headers: { Accept: "audio/*,*/*;q=0.1", "User-Agent": "ChurchApps-Podcast-Element/1.0" }
    });
    const headers = (response.headers || {}) as Record<string, unknown>;
    const status = response.status;
    const location = headerValue(headers, "location");
    const contentType = headerValue(headers, "content-type");
    const lengthRaw = headerValue(headers, "content-length");
    const contentLength = lengthRaw && /^\d+$/.test(lengthRaw) ? parseInt(lengthRaw, 10) : null;
    if (status < 200 || status >= 300) {
      response.data?.destroy?.();
      return { status, location, contentType, contentLength, body: null };
    }
    const body = response.data ? Readable.toWeb(response.data) as ReadableStream<Uint8Array> : null;
    return { status, location, contentType, contentLength, body };
  } catch {
    throw new PodcastDownloadError("Unable to download this episode", 502);
  }
}

function isAudioType(contentType: string | null): boolean {
  const type = (contentType || "").split(";")[0].trim().toLowerCase();
  return type.startsWith("audio/") || type === "application/octet-stream" || type === "binary/octet-stream" || type === "";
}

export async function followAudio(startUrl: string, fetchHop: (url: string) => Promise<Hop>, lookup?: LookupFn): Promise<Hop> {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current, lookup);
    const res = await fetchHop(current);
    if (res.status >= 300 && res.status < 400) {
      await res.body?.cancel().catch(() => undefined);
      if (!res.location) throw new PodcastDownloadError("Unable to download this episode", 502);
      current = new URL(res.location, current).toString();
      continue;
    }
    if (res.status < 200 || res.status >= 300 || !res.body) {
      await res.body?.cancel().catch(() => undefined);
      throw new PodcastDownloadError("Unable to download this episode", 502);
    }
    if (res.contentLength !== null && res.contentLength > MAX_BYTES) {
      await res.body.cancel().catch(() => undefined);
      throw new PodcastDownloadError("Episode is too large", 502);
    }
    if (!isAudioType(res.contentType)) {
      await res.body.cancel().catch(() => undefined);
      throw new PodcastDownloadError("Episode file is not audio", 502);
    }
    const type = (res.contentType || "").split(";")[0].trim().toLowerCase();
    return { ...res, contentType: type.startsWith("audio/") ? type : null };
  }
  throw new PodcastDownloadError("Unable to download this episode", 502);
}

export function contentApiBase(): string {
  const stage = process.env.NEXT_PUBLIC_STAGE || process.env.NEXT_STAGE || "";
  const base = (stage === "selfhost" && process.env.B1_API_INTERNAL_URL) || process.env.NEXT_PUBLIC_API_BASE
    || (stage === "prod" ? "https://api.churchapps.org" : "https://api.staging.churchapps.org");
  return base.replace(/\/$/, "") + "/content";
}

async function defaultFetchFeed(feedUrl: string): Promise<{ status: number; json: unknown }> {
  try {
    const res = await fetch(contentApiBase() + "/podcast/feed?url=" + encodeURIComponent(feedUrl), {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" }
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  } catch {
    throw new PodcastDownloadError("Unable to load the podcast feed", 502);
  }
}

function feedFailure(json: unknown, status: number): PodcastDownloadError {
  const message = json && typeof json === "object" && typeof (json as { error?: unknown }).error === "string"
    ? (json as { error: string }).error.slice(0, 200)
    : "Unable to load the podcast feed";
  return new PodcastDownloadError(message, status >= 500 ? 502 : 400);
}

export async function preparePodcastDownload(feedUrl: string, guid: string, deps: DownloadDeps = {}): Promise<DownloadResult> {
  const url = (feedUrl || "").trim();
  const id = (guid || "").trim();
  if (!url || !id) throw new PodcastDownloadError("A feed url and episode are required", 400);
  const feedRes = await (deps.fetchFeed ?? defaultFetchFeed)(url);
  if (feedRes.status < 200 || feedRes.status >= 300) throw feedFailure(feedRes.json, feedRes.status);
  const episode = pickEpisode(feedRes.json, id);
  if (!episode) throw new PodcastDownloadError("Episode not found", 404);
  const audio = await followAudio(episode.audioUrl, deps.fetchHop ?? defaultFetchHop, deps.lookup);
  const filename = episodeFilename(episode.title, episode.audioType, episode.audioUrl);
  const fromFeed = episode.audioType.split(";")[0].trim().toLowerCase();
  const contentType = audio.contentType || (fromFeed.startsWith("audio/") ? fromFeed : "audio/mpeg");
  return {
    body: audio.body as ReadableStream<Uint8Array>,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition(filename),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  };
}
