import { ApiHelper } from "./ApiHelper"
import { UserInterface, ChurchInterface, UserContextInterface, IPermission, PersonInterface } from "../interfaces";

export class UserHelper {
  static currentChurch: ChurchInterface;
  static churches: ChurchInterface[];
  static user: UserInterface;
  static churchChanged: boolean = false;
  static person: PersonInterface;

  static selectChurch = async (context?: UserContextInterface, churchId?: string, keyName?: string) => {
    let church = null;

    if (churchId) {
      UserHelper.churches.forEach(c => {
        if (c.id === churchId) church = c;
      });
    }
    else if (keyName) UserHelper.churches.forEach(c => { if (c.subDomain === keyName) church = c; });
    else church = UserHelper.churches[0];
    if (!church) return;
    else {
      UserHelper.currentChurch = church;
      UserHelper.setupApiHelper(UserHelper.currentChurch);
      // TODO - remove context code from here and perform the logic in the component itself.
      if (context) {
        if (context.church !== null) UserHelper.churchChanged = true;
        context.setChurch(UserHelper.currentChurch);
      }
    }
  }

  static setupApiHelper(church: ChurchInterface) {
    ApiHelper.setDefaultPermissions(church.jwt);
    church.apis.forEach(api => { ApiHelper.setPermissions(api.keyName, api.jwt, api.permissions); });
  }

  static setupApiHelperNoChurch(user: UserInterface) {
    ApiHelper.setDefaultPermissions(user.jwt);
  }

  static checkAccess({ api, contentType, action }: IPermission): boolean {
    const permissions = ApiHelper.getConfig(api).permisssions;

    let result = false;
    if (permissions !== undefined) {
      permissions.forEach(element => {
        if (element.contentType === contentType && element.action === action) result = true;
      });
    }
    return result;
  }

  static createAppUrl(appUrl: string, returnUrl: string) {
    const jwt = ApiHelper.getConfig("AccessApi").jwt;

    return `${appUrl}/login/?jwt=${jwt}&returnUrl=${returnUrl}`;
  }
}
