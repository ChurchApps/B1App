export class UrlHelper {
  /**
   * Removes the sdSlug from a pathname to create a proper return URL
   * Example: "/grace/my/timeline" becomes "/my/timeline"
   * Example: "/church-name/admin/site" becomes "/admin/site"
   */
  static getReturnUrl(pathname: string, sdSlug?: string): string {
    // Split the pathname into segments
    const segments = pathname.split("/").filter(segment => segment.length > 0);

    // If there are no segments, return the original path
    if (segments.length === 0) {
      return pathname;
    }

    // Check if the first segment matches the sdSlug (if provided)
    // or if it looks like an sdSlug (not a known route like 'admin', 'my', etc.)
    const knownRoutes = ["admin", "my", "login", "logout", "groups", "stream"];
    const firstSegment = segments[0];

    const shouldRemoveFirstSegment = sdSlug
      ? firstSegment === sdSlug
      : !knownRoutes.includes(firstSegment);

    // Only remove the first segment if it's actually an sdSlug
    if (shouldRemoveFirstSegment && segments.length > 1) {
      return "/" + segments.slice(1).join("/");
    }

    return pathname;
  }
}
