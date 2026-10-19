/**
 * The ContentApi path for a church page's tree, with the slug encoded. A slug taken from the request
 * URL can hold anything (backslashes, spaces); passed raw it made the Api answer 400 and the page 500.
 * Null when there is no church id to ask for, which the caller turns into a 404.
 */
export function pageTreePath(churchId: string | undefined | null, pageSlug: string, siteId?: string | null): string | null {
  if (!churchId) return null;
  return "/pages/" + encodeURIComponent(churchId) + "/tree?url=" + encodeURIComponent(pageSlug) + (siteId ? "&siteId=" + encodeURIComponent(siteId) : "");
}
