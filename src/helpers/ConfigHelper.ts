import { ApiHelper } from "@churchapps/apphelper";
import type { ChurchInterface, LinkInterface } from "@churchapps/helpers";
import type { AppearanceInterface } from "@churchapps/apphelper";
import { GlobalStyleInterface, PageInterface } from "./interfaces";
import { startTransition } from "react";
import { revalidate } from "@/app/actions";

export interface ColorsInterface { primary: string, contrast: string, header: string }
export interface LogoInterface { url: string, image: string }
export interface ButtonInterface { text: string, url: string }
export interface ServiceInterface { videoUrl: string, serviceTime: string, duration: string, earlyStart: string, chatBefore: string, chatAfter: string, provider: string, providerKey: string, localCountdownTime?: Date, localStartTime?: Date, localEndTime?: Date, localChatStart?: Date, localChatEnd?: Date, label: string }
export interface AppThemeModeColors { background: string, surface: string, primary: string, primaryContrast: string, secondary: string, textColor: string }
export interface AppThemeConfig { light: AppThemeModeColors, dark: AppThemeModeColors }
export interface ConfigurationInterface { keyName?: string, navLinks?: LinkInterface[], church: ChurchInterface, appearance: AppearanceInterface, allowDonations:boolean, hasWebsite:boolean, globalStyles:GlobalStyleInterface, homePage?: PageInterface, appTheme?: AppThemeConfig }

export class ConfigHelper {

  static clearCache(sdKey: string) {
    startTransition(() => {
      revalidate(sdKey);
    });
  }

  static async load(keyName: string, navCategory:string = "b1Tab") {
    // Without a subdomain the lookup hits //churches/lookup/ and 404s (Sentry B1-APP-95/94).
    if (!keyName) throw new Error("ConfigHelper.load called without a church subdomain");
    // NOTE: ApiHelper.getAnonymous never supported a cache-tags argument; the old third
    // argument was silently ignored, so the revalidate(sdKey) tag invalidation in clearCache
    // has never been wired to these fetches.
    const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup/?subDomain=" + keyName, "MembershipApi");
    const appearance = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
    const tabs: LinkInterface[] = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=" + navCategory, "ContentApi");
    const homePage: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=/", "ContentApi");
    const gatewayConfigured = await ApiHelper.getAnonymous("/gateways/configured/" + church.id, "GivingApi");
    const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
    let appTheme: AppThemeConfig | undefined;
    try {
      if (appearance?.appTheme) {
        const themeData = typeof appearance.appTheme === "string" ? JSON.parse(appearance.appTheme) : appearance.appTheme;
        if (themeData && themeData.light) appTheme = themeData;
      }
    } catch { /* no app theme configured */ }

    // Check if gateway is properly configured with a valid privateKey
    // This prevents showing the donate tab when no payment gateway is set up
    const allowDonations = gatewayConfigured?.configured === true;

    const result: ConfigurationInterface = { appearance: appearance, church: church, navLinks: tabs, allowDonations, hasWebsite: Boolean(homePage?.url), globalStyles, homePage, appTheme };
    result.keyName = keyName;
    return result;
  }

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
