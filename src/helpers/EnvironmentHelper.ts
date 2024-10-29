import { ApiHelper, CommonEnvironmentHelper, Locale } from "@churchapps/apphelper";

export class EnvironmentHelper {
  static Common = CommonEnvironmentHelper;
  public static LessonsApi = "";
  static hasInit = false;

  static initServerSide = async () => {
    if (!this.hasInit) {
      this.init();
      await this.initLocale();
    }
  }

  static init = () => {
    if (this.hasInit) return;
    this.hasInit = true;
    let stage = process.env.NEXT_STAGE || process.env.NEXT_PUBLIC_STAGE;

    //stage="prod"
    switch (stage) {
      case "staging": EnvironmentHelper.initStaging(); break;
      case "prod": EnvironmentHelper.initProd(); break;
      default: EnvironmentHelper.initDev(); break;
    }
    EnvironmentHelper.Common.init(stage)

    ApiHelper.apiConfigs = [
      { keyName: "MembershipApi", url: EnvironmentHelper.Common.MembershipApi, jwt: "", permisssions: [] },
      { keyName: "AttendanceApi", url: EnvironmentHelper.Common.AttendanceApi, jwt: "", permisssions: [] },
      { keyName: "MessagingApi", url: EnvironmentHelper.Common.MessagingApi, jwt: "", permisssions: [] },
      { keyName: "ContentApi", url: EnvironmentHelper.Common.ContentApi, jwt: "", permisssions: [] },
      { keyName: "GivingApi", url: EnvironmentHelper.Common.GivingApi, jwt: "", permisssions: [] },
      { keyName: "DoingApi", url: EnvironmentHelper.Common.DoingApi, jwt: "", permisssions: [] },
      { keyName: "LessonsApi", url: EnvironmentHelper.LessonsApi, jwt: "", permisssions: [] }
    ];
  };

  static initLocale = async () => {
    let baseUrl = "https://ironwood.staging.b1.church";
    if (typeof window !== "undefined") {
      baseUrl = window.location.origin;
    }
    await Locale.init([baseUrl + `/apphelper/locales/{{lng}}.json`])
  }

  static initDev = () => {
    this.initStaging();
    EnvironmentHelper.LessonsApi = process.env.REACT_APP_LESSONS_API || process.env.NEXT_PUBLIC_LESSONS_API || EnvironmentHelper.LessonsApi;
  };

  //NOTE: None of these values are secret.
  static initStaging = () => {
    EnvironmentHelper.LessonsApi = "https://api.staging.lessons.church";
  };

  //NOTE: None of these values are secret.
  static initProd = () => {
    EnvironmentHelper.Common.GoogleAnalyticsTag = "G-XYCPBKWXB5";
    EnvironmentHelper.LessonsApi = "https://api.lessons.church";

  };

}
