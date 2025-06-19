export class UrlHelper {
  /**
   * Removes the sdSlug from a pathname to create a proper return URL
   * Example: "/grace/my/timeline" becomes "/my/timeline"
   * Example: "/church-name/admin/site" becomes "/admin/site"
   */
  static getReturnUrl(pathname: string): string {
    // Split the pathname into segments
    const segments = pathname.split('/').filter(segment => segment.length > 0);
    
    // If there are no segments or only one segment, return the original path
    if (segments.length <= 1) {
      return pathname;
    }
    
    // Remove the first segment (which should be the sdSlug) and reconstruct the path
    const pathWithoutSdSlug = '/' + segments.slice(1).join('/');
    
    return pathWithoutSdSlug;
  }
}