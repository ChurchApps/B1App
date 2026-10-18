import { ApiHelper } from "@churchapps/apphelper";
import { CommonEnvironmentHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { localeOrigin } from "./siteOrigin";

export class EnvironmentHelper {
  static Common = CommonEnvironmentHelper;
  public static LessonsApi = "";
  public static LessonsUrl = "";
  static hasInit = false;
  static hasLocaleInit = false;
  static localeInitPromise: Promise<void> | null = null;

  static initServerSide = async () => {
    this.init();
    if (!this.hasLocaleInit) {
      if (!this.localeInitPromise) {
        this.localeInitPromise = this.initLocale().then(() => { this.hasLocaleInit = true; });
      }
      await this.localeInitPromise;
    }
  };

  static init = () => {
    if (this.hasInit) return;
    this.hasInit = true;
    const stage = process.env.NEXT_STAGE || process.env.NEXT_PUBLIC_STAGE;

    //stage = "prod"
    switch (stage) {
      case "staging": EnvironmentHelper.initStaging(); break;
      case "prod": EnvironmentHelper.initProd(); break;
      default: EnvironmentHelper.initDev(); break;
    }
    EnvironmentHelper.Common.init(stage || "");
    if (stage === "selfhost") EnvironmentHelper.initSelfHost();

    ApiHelper.apiConfigs = [
      { keyName: "MembershipApi", url: EnvironmentHelper.Common.MembershipApi, jwt: "", permissions: [] },
      { keyName: "AttendanceApi", url: EnvironmentHelper.Common.AttendanceApi, jwt: "", permissions: [] },
      { keyName: "MessagingApi", url: EnvironmentHelper.Common.MessagingApi, jwt: "", permissions: [] },
      { keyName: "ContentApi", url: EnvironmentHelper.Common.ContentApi, jwt: "", permissions: [] },
      { keyName: "GivingApi", url: EnvironmentHelper.Common.GivingApi, jwt: "", permissions: [] },
      { keyName: "DoingApi", url: EnvironmentHelper.Common.DoingApi, jwt: "", permissions: [] },
      { keyName: "LessonsApi", url: EnvironmentHelper.LessonsApi, jwt: "", permissions: [] },
      { keyName: "AskApi", url: EnvironmentHelper.Common.AskApi, jwt: "", permissions: [] }
    ];
  };

  static initLocale = async () => {
    const baseUrl = localeOrigin();
    await Locale.init([baseUrl + `/locales/{{lng}}.json?v=1`, baseUrl + `/apphelper/locales/{{lng}}.json`]);
  };

  // Self-hosted stack: the browser talks to /api on its own origin; the server talks to the api container directly.
  // PUBLIC_URL and B1_API_INTERNAL_URL are plain (not NEXT_PUBLIC_) env vars so one image serves any domain.
  static initSelfHost = () => {
    const isBrowser = typeof window !== "undefined";
    const publicUrl = (isBrowser ? window.location.origin : process.env.PUBLIC_URL || "http://localhost").replace(/\/$/, "");
    const common = EnvironmentHelper.Common;
    const apiBase = isBrowser ? publicUrl + "/api" : process.env.B1_API_INTERNAL_URL || "http://api:8084";
    for (const mod of ["Membership", "Attendance", "Content", "Giving", "Messaging", "Doing", "Reporting"]) (common as any)[mod + "Api"] = apiBase + "/" + mod.toLowerCase();
    common.MessagingApiSocket = publicUrl.replace(/^http/, "ws") + "/api/";
    common.ContentRoot = publicUrl + "/api/content";
    common.B1Root = publicUrl;
    common.B1AdminRoot = publicUrl + "/admin";
    common.LessonsRoot = "https://lessons.church";
    common.AskApi = "https://askapi.churchapps.org";
    common.GoogleAnalyticsTag = "";
    EnvironmentHelper.LessonsApi = "https://api.lessons.church";
    EnvironmentHelper.LessonsUrl = "https://lessons.church";
  };

  static initDev = () => {
    this.initStaging();
    EnvironmentHelper.LessonsApi = process.env.REACT_APP_LESSONS_API || process.env.NEXT_PUBLIC_LESSONS_API || EnvironmentHelper.LessonsApi;
  };

  //NOTE: None of these values are secret.
  static initStaging = () => {
    EnvironmentHelper.LessonsApi = "https://api.staging.lessons.church";
    EnvironmentHelper.LessonsUrl = "https://staging.lessons.church";
  };

  //NOTE: None of these values are secret.
  static initProd = () => {
    EnvironmentHelper.Common.GoogleAnalyticsTag = "G-XYCPBKWXB5";
    EnvironmentHelper.LessonsApi = "https://api.lessons.church";
    EnvironmentHelper.LessonsUrl = "https://lessons.church";
  };

}
