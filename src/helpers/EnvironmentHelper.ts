import { ApiHelper } from "./index";
import { CommonEnvironmentHelper } from "../appBase/helpers/CommonEnvironmentHelper";

export class EnvironmentHelper {
  private static HideYoursite = false;
  static Common = CommonEnvironmentHelper;

  static init = () => {
    let stage = process.env.NEXT_STAGE || process.env.NEXT_PUBLIC_STAGE;
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
      { keyName: "GivingApi", url: EnvironmentHelper.Common.GivingApi, jwt: "", permisssions: [] }
    ];
  };

  static initDev = () => {
    this.initStaging();
    if (process.env.NEXT_HIDE_YOURSITE === "1") EnvironmentHelper.HideYoursite = true;
  };

  //NOTE: None of these values are secret.
  static initStaging = () => {
    EnvironmentHelper.HideYoursite = false;
  };

  //NOTE: None of these values are secret.
  static initProd = () => {
    EnvironmentHelper.HideYoursite = true;
  };

  static shouldHideYourSite = (churchId: string) => {
    let result = EnvironmentHelper.HideYoursite;
    if (result) {
      const exceptions = ["40", "IbZzogNKDzr"];
      if (exceptions.indexOf(churchId) > -1) result = false;
    }
    return result;
  }

}
