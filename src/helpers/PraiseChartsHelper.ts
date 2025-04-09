import { ApiHelper } from "@churchapps/apphelper";
import { EnvironmentHelper } from "./EnvironmentHelper";

export class PraiseChartsHelper {

  static async download(sku: string, fileName: string, keys: string) {
    let url = `/praiseCharts/download?skus=${sku}&keys=${keys}&file_name=${encodeURIComponent(fileName)}`;
    if (keys) url += "&keys=" + keys;
    const data = await ApiHelper.get(url, "ContentApi");
    let redirectUrl = data.redirectUrl;

    if (EnvironmentHelper.Common.ContentApi.indexOf("localhost") > -1) redirectUrl = EnvironmentHelper.Common.ContentApi + redirectUrl;
    else redirectUrl = EnvironmentHelper.Common.ContentRoot + redirectUrl;
    return redirectUrl;
  }

}
