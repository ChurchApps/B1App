export class UrlHelper {
  /** Removes sdSlug from pathname to create a proper return URL. */
  static getReturnUrl(pathname: string, sdSlug?: string): string {
    const segments = pathname.split("/").filter(segment => segment.length > 0);

    if (segments.length === 0) {
      return pathname;
    }

    const knownRoutes = ["admin", "my", "login", "logout", "groups", "stream"];
    const firstSegment = segments[0];

    const shouldRemoveFirstSegment = sdSlug
      ? firstSegment === sdSlug
      : !knownRoutes.includes(firstSegment);

    if (shouldRemoveFirstSegment && segments.length > 1) {
      return "/" + segments.slice(1).join("/");
    }

    return pathname;
  }
}
