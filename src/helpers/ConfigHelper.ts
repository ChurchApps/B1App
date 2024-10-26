"use client";
import { AppearanceInterface, ChurchInterface, ApiHelper, LinkInterface, UserHelper, Permissions} from "@churchapps/apphelper";
import { PageInterface } from "./interfaces";
export interface ColorsInterface { primary: string, contrast: string, header: string }
export interface LogoInterface { url: string, image: string }
export interface ButtonInterface { text: string, url: string }
export interface ServiceInterface { videoUrl: string, serviceTime: string, duration: string, earlyStart: string, chatBefore: string, chatAfter: string, provider: string, providerKey: string, localCountdownTime?: Date, localStartTime?: Date, localEndTime?: Date, localChatStart?: Date, localChatEnd?: Date, label: string }
export interface ConfigurationInterface { keyName?: string, tabs?: LinkInterface[], church: ChurchInterface, appearance: AppearanceInterface, allowDonations:boolean, hasWebsite:boolean }

export class ConfigHelper {

  static async load(keyName: string) {
    const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup/?subDomain=" + keyName, "MembershipApi")
    let appearance = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
    const tabs: LinkInterface[] = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=b1Tab", "ContentApi");
    const gateway = await ApiHelper.getAnonymous("/gateways/churchId/" + church.id, "GivingApi");
    const homePage: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?url=/", "ContentApi");

    let result: ConfigurationInterface = { appearance: appearance, church: church, tabs: tabs, allowDonations:gateway!==null, hasWebsite: Boolean(homePage?.url) }
    result.keyName = keyName;
    return result;
  }

  static getFirstRoute(config: ConfigurationInterface) {
    const firstTab = config.tabs[0]

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
