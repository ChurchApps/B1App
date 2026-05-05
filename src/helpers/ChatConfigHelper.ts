"use client";
import type { AppearanceInterface } from "@churchapps/apphelper";
import type { SermonInterface } from "@churchapps/helpers";
import { EnvironmentHelper, StreamConfigInterface } from ".";
import { StreamingServiceHelper } from "./StreamingServiceHelper";

export interface ColorsInterface { primary: string, contrast: string, header: string }
export interface LogoInterface { url: string, image: string }
export interface ButtonInterface { text: string, url: string }
export interface TabInterface { text: string, url: string, icon: string, type: string, data: string, updated?: boolean }
export interface ServiceInterface { videoUrl: string, serviceTime: string, earlyStart: string, chatBefore: string, chatAfter: string, provider: string, providerKey: string, localCountdownTime?: Date, localStartTime?: Date, localEndTime?: Date, localChatStart?: Date, localChatEnd?: Date, label: string, id?: string, sermon?: SermonInterface }
export interface ConfigurationInterface { keyName?: string, churchId?: string, appearance: AppearanceInterface, buttons?: ButtonInterface[], tabs?: TabInterface[], services?: ServiceInterface[] }

export class ChatConfigHelper {
  static current: StreamConfigInterface;

  static loadCached(keyName: string) {
    const json = localStorage.getItem("config_" + keyName);
    if (!json) return null;
    else return JSON.parse(json) as ConfigurationInterface;
  }

  static async load(keyName: string) {
    const result: ConfigurationInterface = await fetch(`${EnvironmentHelper.Common.ContentApi}/preview/data/${keyName}`).then((response: Response) => response.json());
    StreamingServiceHelper.updateServiceTimes(result);
    result.keyName = keyName;
    ChatConfigHelper.current = result;
    localStorage.setItem("config_" + keyName, JSON.stringify(ChatConfigHelper.current));
    return result;
  }

  static setTabUpdated(tabType: string) {
    if (!ChatConfigHelper.current?.tabs) return;
    for (const t of ChatConfigHelper.current.tabs) {
      if (t.type === tabType) t.updated = true;
    }
  }
}
