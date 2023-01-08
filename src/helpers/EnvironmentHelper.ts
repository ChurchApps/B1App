import { ApiHelper } from "./index";
import { CommonEnvironmentHelper } from "../appBase/helpers/CommonEnvironmentHelper";

export class EnvironmentHelper {
  private static ContentApi = "";
  private static B1Api = "";
  static Common = CommonEnvironmentHelper;

  static init = () => {
    let stage = process.env.STAGE;

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
      { keyName: "B1Api", url: EnvironmentHelper.B1Api, jwt: "", permisssions: [] },
      { keyName: "ContentApi", url: EnvironmentHelper.ContentApi, jwt: "", permisssions: [] },
      { keyName: "GivingApi", url: EnvironmentHelper.Common.GivingApi, jwt: "", permisssions: [] }
    ];
  };

  static initDev = () => {
    this.initStaging();
    EnvironmentHelper.B1Api = process.env.NEXT_PUBLIC_B1_API || "";
    EnvironmentHelper.ContentApi = process.env.NEXT_PUBLIC_CONTENT_API || EnvironmentHelper.ContentApi;

  };

  //NOTE: None of these values are secret.
  static initStaging = () => {
    console.log("INIT STAGING");
    EnvironmentHelper.B1Api = "https://api.staging.b1.church";
    EnvironmentHelper.ContentApi = "https://contentapi.staging.churchapps.org";

  };

  //NOTE: None of these values are secret.
  static initProd = () => {
    EnvironmentHelper.B1Api = "https://api.b1.church";
    EnvironmentHelper.ContentApi = "https://contentapi.churchapps.org";

  };
}
