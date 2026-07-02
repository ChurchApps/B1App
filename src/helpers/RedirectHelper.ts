import { fetchCached } from "./ConfigHelper";

export interface RedirectInterface { id?: string; fromPath: string; toPath: string; createdDate?: string; }

const normalizePath = (path: string): string => {
  if (!path) return path;
  let p = path.trim().toLowerCase();
  if (!p.startsWith("/")) p = "/" + p;
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p;
};

export const resolveRedirect = async (churchId: string, sdSlug: string, requestPath: string): Promise<string | null> => {
  try {
    const normalized = normalizePath(requestPath);
    const redirects = await fetchCached<RedirectInterface[]>("/redirects/public/" + churchId, "ContentApi", sdSlug);
    const match = Array.isArray(redirects) ? redirects.find((r) => r.fromPath === normalized) : undefined;
    return match?.toPath || null;
  } catch {
    return null;
  }
};
