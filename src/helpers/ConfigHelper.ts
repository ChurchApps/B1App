import { ApiHelper } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import type { ChurchInterface, LinkInterface } from "@churchapps/helpers";
import type { AppearanceInterface } from "@churchapps/helpers/dist/AppearanceHelper";
import { GlobalStyleInterface, PageInterface } from "./interfaces";
import { startTransition } from "react";
import { revalidate } from "@/app/actions";
import { unstable_cache } from "next/cache";
export interface ColorsInterface { primary: string, contrast: string, header: string }
export interface LogoInterface { url: string, image: string }
export interface ButtonInterface { text: string, url: string }
export interface ServiceInterface { videoUrl: string, serviceTime: string, duration: string, earlyStart: string, chatBefore: string, chatAfter: string, provider: string, providerKey: string, localCountdownTime?: Date, localStartTime?: Date, localEndTime?: Date, localChatStart?: Date, localChatEnd?: Date, label: string }
export interface ConfigurationInterface { keyName?: string, navLinks?: LinkInterface[], church: ChurchInterface, appearance: AppearanceInterface, allowDonations:boolean, hasWebsite:boolean, globalStyles:GlobalStyleInterface }

export class ConfigHelper {

  static clearCache(sdKey: string) {
    startTransition(() => {
      revalidate(sdKey);
    })
  }

  static async load(keyName: string, navCategory:string = "b1Tab") {
    return unstable_cache(
      async () => {
        const cacheKey = "sd_" + keyName;
        const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup/?subDomain=" + keyName, "MembershipApi", [cacheKey])
        let appearance = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi", [cacheKey]);
        const tabs: LinkInterface[] = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=" + navCategory, "ContentApi", [cacheKey]);
        const homePage: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=/", "ContentApi", [cacheKey]);
        const gatewayConfigured = await ApiHelper.getAnonymous("/gateways/configured/" + church.id, "GivingApi", [cacheKey]);
        const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");

    // Check if gateway is properly configured with a valid privateKey
    // This prevents showing the donate tab when no payment gateway is set up
    const allowDonations = gatewayConfigured?.configured === true;

        let result: ConfigurationInterface = { appearance: appearance, church: church, navLinks: tabs, allowDonations, hasWebsite: Boolean(homePage?.url), globalStyles }
        result.keyName = keyName;
        return result;
      },
      [keyName, navCategory],
      {
        tags: [keyName],
        revalidate: 300 // 5 minutes
      }
    )();
  }

  static getFirstRoute(config: ConfigurationInterface) {
    const firstTab = config.navLinks[0]

    if (!firstTab) {
      return (UserHelper.checkAccess(Permissions.contentApi.content.edit) || UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit)) ? "/admin/settings" : "/"
    }

    let route = ""
    switch (firstTab.linkType) {
      case "lessons":
        route = "/lessons"
        break
      case "donation":
        route = "/donate"
        break
      case "checkin":
        route = "/checkin"
        break
      case "stream":
        route = "/stream"
        break
      case "directory":
        route = "/directory"
        break
      case "bible":
        route = "/bible"
        break
      case "url":
        route = `/url/${firstTab.id}`
        break
      case "page":
        route = `/pages/${firstTab.churchId}/${firstTab.linkData}`
        break
      case "donationLanding":
        route = "/donation-landing"
        break
      default:
        route = "/"
        break
    }

    return route
  }

}
