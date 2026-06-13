import { ApiHelper } from "@churchapps/apphelper";
import type { ChurchInterface, LinkInterface } from "@churchapps/helpers";
import type { AppearanceInterface } from "@churchapps/apphelper";
import { GlobalStyleInterface, PageInterface } from "./interfaces";
import { cache, startTransition } from "react";
import { revalidate } from "@/app/actions";

export interface ColorsInterface { primary: string, contrast: string, header: string }
export interface LogoInterface { url: string, image: string }
export interface ButtonInterface { text: string, url: string }
export interface ServiceInterface { videoUrl: string, serviceTime: string, duration: string, earlyStart: string, chatBefore: string, chatAfter: string, provider: string, providerKey: string, localCountdownTime?: Date, localStartTime?: Date, localEndTime?: Date, localChatStart?: Date, localChatEnd?: Date, label: string }
export interface AppThemeModeColors { background: string, surface: string, primary: string, primaryContrast: string, secondary: string, textColor: string }
export interface AppThemeConfig { light: AppThemeModeColors, dark: AppThemeModeColors }
export interface ConfigurationInterface { keyName?: string, navLinks?: LinkInterface[], church: ChurchInterface, appearance: AppearanceInterface, allowDonations:boolean, hasWebsite:boolean, globalStyles:GlobalStyleInterface, homePage?: PageInterface, appTheme?: AppThemeConfig }

// Prod caches config for 5 min; dev/test fetch fresh so content/style edits show immediately.
const CONFIG_REVALIDATE_SECONDS = process.env.NODE_ENV === "production" ? 300 : 0;


const fetchCached = async <T>(path: string, apiName: string, tag: string): Promise<T> => {
  const apiConfig = ApiHelper.getConfig(apiName);
  if (!apiConfig) throw new Error("Unconfigured API: " + apiName);
  const url = apiConfig.url + path;
  const response = await fetch(url, { next: { revalidate: CONFIG_REVALIDATE_SECONDS, tags: [tag] } } as RequestInit);
  if (!response.ok) throw new Error(response.status + " " + response.statusText + " for " + url);
  return response.json();
};

export class ConfigHelper {

  static clearCache(sdKey: string) {
    startTransition(() => {
      revalidate(sdKey);
    });
  }


  static load = cache(async (keyName: string, navCategory: string = "b1Tab"): Promise<ConfigurationInterface> => {
    // Without a subdomain the lookup hits //churches/lookup/ and 404s (Sentry B1-APP-95/94).
    if (!keyName) throw new Error("ConfigHelper.load called without a church subdomain");
    const church: ChurchInterface = await fetchCached("/churches/lookup/?subDomain=" + keyName, "MembershipApi", keyName);
    const [appearance, tabs, homePage, gatewayConfigured, globalStyles] = await Promise.all([
      fetchCached<AppearanceInterface>("/settings/public/" + church.id, "MembershipApi", keyName),
      fetchCached<LinkInterface[]>("/links/church/" + church.id + "?category=" + navCategory, "ContentApi", keyName),
      ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=/", "ContentApi") as Promise<PageInterface>,
      fetchCached<{ configured?: boolean }>("/gateways/configured/" + church.id, "GivingApi", keyName),
      fetchCached<GlobalStyleInterface>("/globalStyles/church/" + church.id, "ContentApi", keyName)
    ]);
    let appTheme: AppThemeConfig | undefined;
    try {
      const rawTheme = (appearance as any)?.appTheme;
      if (rawTheme) {
        const themeData = typeof rawTheme === "string" ? JSON.parse(rawTheme) : rawTheme;
        if (themeData && themeData.light) appTheme = themeData;
      }
    } catch { /* no app theme configured */ }

    // Check if gateway is properly configured with a valid privateKey
    // This prevents showing the donate tab when no payment gateway is set up
    const allowDonations = gatewayConfigured?.configured === true;

    const result: ConfigurationInterface = { appearance: appearance, church: church, navLinks: tabs, allowDonations, hasWebsite: Boolean(homePage?.url), globalStyles, homePage, appTheme };
    result.keyName = keyName;
    return result;
  });

  static getFirstRoute(config: ConfigurationInterface) {
    if (!config.navLinks || config.navLinks.length === 0) {
      return "/";
    }

    const firstTab = config.navLinks[0];

    if (!firstTab) {
      return "/";
    }

    let route = "";
    switch (firstTab.linkType) {
      case "lessons": route = "/lessons"; break;
      case "donation": route = "/donate"; break;
      case "checkin": route = "/checkin"; break;
      case "stream": route = "/stream"; break;
      case "directory": route = "/directory"; break;
      case "bible": route = "/bible"; break;
      case "url": route = `/url/${firstTab.id}`; break;
      case "page": route = `/pages/${firstTab.churchId}/${firstTab.linkData}`; break;
      case "donationLanding": route = "/donation-landing"; break;
      default: route = "/"; break;
    }

    return route;
  }

}
