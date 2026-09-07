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
export interface ConfigurationInterface { keyName?: string, siteId?: string, navLinks?: LinkInterface[], church: ChurchInterface, appearance: AppearanceInterface, allowDonations:boolean, hasWebsite:boolean, globalStyles:GlobalStyleInterface, homePage?: PageInterface, appTheme?: AppThemeConfig }

// Prod caches config for 5 min; dev/test fetch fresh so content/style edits show immediately.
const CONFIG_REVALIDATE_SECONDS = process.env.NODE_ENV === "production" ? 300 : 0;


export const fetchCached = async <T>(path: string, apiName: string, tag: string): Promise<T> => {
  const apiConfig = ApiHelper.getConfig(apiName);
  if (!apiConfig) throw new Error("Unconfigured API: " + apiName);
  const url = apiConfig.url + path;
  const response = await fetch(url, { next: { revalidate: CONFIG_REVALIDATE_SECONDS, tags: [tag] } } as RequestInit);
  if (!response.ok) throw new Error(response.status + " " + response.statusText + " for " + url);
  return response.json();
};

// Same as fetchCached but treats a true 404 as "not found" instead of throwing (Sentry B1-APP-AK/AM/AN/AP/AQ/AR).
export const fetchCachedOrNull = async <T>(path: string, apiName: string, tag: string): Promise<T | null> => {
  const apiConfig = ApiHelper.getConfig(apiName);
  if (!apiConfig) throw new Error("Unconfigured API: " + apiName);
  const url = apiConfig.url + path;
  const response = await fetch(url, { next: { revalidate: CONFIG_REVALIDATE_SECONDS, tags: [tag] } } as RequestInit);
  if (response.status === 404) return null;
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
    const siteId = (church as any).siteId || "";
    const [appearance, tabs, homePage, gatewayConfigured, globalStyles] = await Promise.all([
      fetchCached<AppearanceInterface>("/settings/public/" + church.id, "MembershipApi", keyName),
      fetchCachedOrNull<LinkInterface[]>("/links/church/" + church.id + "?category=" + navCategory + (siteId ? "&siteId=" + siteId : ""), "ContentApi", keyName),
      fetchCachedOrNull<PageInterface>("/pages/" + church.id + "/tree?url=/" + (siteId ? "&siteId=" + siteId : ""), "ContentApi", keyName),
      fetchCachedOrNull<{ configured?: boolean }>("/gateways/configured/" + church.id, "GivingApi", keyName),
      fetchCachedOrNull<GlobalStyleInterface>("/globalStyles/church/" + church.id + (siteId ? "?siteId=" + siteId : ""), "ContentApi", keyName)
    ]);
    let appTheme: AppThemeConfig | undefined;
    try {
      const rawTheme = (appearance as any)?.appTheme;
      if (rawTheme) {
        const themeData = typeof rawTheme === "string" ? JSON.parse(rawTheme) : rawTheme;
        if (themeData && themeData.light) appTheme = themeData;
      }
    } catch { /* no app theme configured */ }

    // Prevents showing donate tab without a configured gateway.
    const allowDonations = gatewayConfigured?.configured === true;

    const result: ConfigurationInterface = { appearance: appearance, church: church, navLinks: tabs || [], allowDonations, hasWebsite: Boolean(homePage?.url), globalStyles: globalStyles || {}, homePage: homePage || undefined, appTheme };
    result.keyName = keyName;
    result.siteId = siteId;
    return result;
  });

}
