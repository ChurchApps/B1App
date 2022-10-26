import { ApiHelper } from "./index";
import { CommonEnvironmentHelper } from "../appBase/helpers/CommonEnvironmentHelper";

export class EnvironmentHelper {
  private static LessonsApi = "";
  static GoogleAnalyticsTag = "";
  static Common = CommonEnvironmentHelper;

  static init = () => {
    let stage = process.env.STAGE;
    //stage = "prod"
    switch (stage) {
      case "staging": EnvironmentHelper.initStaging(); break;
      case "prod": EnvironmentHelper.initProd(); break;
      default: EnvironmentHelper.initDev(); break;
    }
    EnvironmentHelper.Common.init(stage)

    ApiHelper.apiConfigs = [
      { keyName: "AccessApi", url: EnvironmentHelper.Common.AccessApi, jwt: "", permisssions: [] },
      { keyName: "MembershipApi", url: EnvironmentHelper.Common.MembershipApi, jwt: "", permisssions: [] },
      { keyName: "LessonsApi", url: EnvironmentHelper.LessonsApi, jwt: "", permisssions: [] },
    ];
  };

  static initDev = () => {
    this.initStaging();

    EnvironmentHelper.LessonsApi = process.env.NEXT_PUBLIC_LESSONS_API || EnvironmentHelper.LessonsApi;
    EnvironmentHelper.GoogleAnalyticsTag = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || EnvironmentHelper.GoogleAnalyticsTag;
  };

  //NOTE: None of these values are secret.
  static initStaging = () => {
    console.log("INIT STAGING");
    EnvironmentHelper.LessonsApi = "https://api.staging.lessons.church";
    EnvironmentHelper.GoogleAnalyticsTag = "";
  };

  //NOTE: None of these values are secret.
  static initProd = () => {
    EnvironmentHelper.LessonsApi = "https://api.lessons.church";
    EnvironmentHelper.GoogleAnalyticsTag = "UA-164774603-9";
  };
}
