import { ApiHelper } from "@churchapps/apphelper";
import { EnvironmentHelper } from "./EnvironmentHelper";
import { isPublicSiteHidden } from "./publicSite";

// Route handlers (robots.txt, sitemap.xml) that don't load the full ConfigHelper config. Tagged by subdomain so the admin toggle's revalidate busts it.
export const loadPublicSiteHidden = async (sdSlug: string): Promise<boolean> => {
  EnvironmentHelper.init();
  try {
    // Dev Playwright flips hidePublicSite on and off. A 3600s cache would keep serving an empty sitemap after the flag is cleared.
    const opts = (process.env.NODE_ENV === "production"
      ? { next: { revalidate: 3600, tags: [sdSlug] } }
      : { cache: "no-store" }) as RequestInit;
    const churchResponse = await fetch(ApiHelper.getConfig("MembershipApi")?.url + "/churches/lookup/?subDomain=" + sdSlug, opts);
    const church = churchResponse.ok ? await churchResponse.json() : null;
    if (!church?.id) return false;
    const settingsResponse = await fetch(ApiHelper.getConfig("ContentApi")?.url + "/settings/public/" + church.id, opts);
    return settingsResponse.ok ? isPublicSiteHidden(await settingsResponse.json()) : false;
  } catch {
    return false;
  }
};
