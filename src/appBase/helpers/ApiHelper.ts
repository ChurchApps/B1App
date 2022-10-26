import { ApiConfig, RolePermissionInterface, ApiListType } from "../interfaces";

export class ApiHelper {

  static apiConfigs: ApiConfig[] = [];
  static isAuthenticated = false;

  static getConfig(keyName: string) {
    let result: ApiConfig;
    this.apiConfigs.forEach(config => { if (config.keyName === keyName) result = config });
    //if (result === null) throw new Error("Unconfigured API: " + keyName);
    return result;
  }

  static setDefaultPermissions(jwt: string) {
    this.apiConfigs.forEach(config => {
      config.jwt = jwt;
      config.permisssions = [];
    });
    this.isAuthenticated = true;
  }

  static setPermissions(keyName: string, jwt: string, permissions: RolePermissionInterface[]) {
    this.apiConfigs.forEach(config => {
      if (config.keyName === keyName) {
        config.jwt = jwt;
        config.permisssions = permissions;
      }
    });
    this.isAuthenticated = true;
  }

  static clearPermissions() {
    this.apiConfigs.forEach(config => { config.jwt = ""; config.permisssions = []; });
    this.isAuthenticated = false;
  }

  static async get(path: string, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    const requestOptions = { method: "GET", headers: { Authorization: "Bearer " + config.jwt } };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async getAnonymous(path: string, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    const requestOptions = { method: "GET" };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async post(path: string, data: any[] | {}, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    const requestOptions = {
      method: "POST",
      headers: { Authorization: "Bearer " + config.jwt, "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async patch(path: string, data: any[] | {}, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    const requestOptions = {
      method: "PATCH",
      headers: { Authorization: "Bearer " + config.jwt, "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async delete(path: string, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    const requestOptions = {
      method: "DELETE",
      headers: { Authorization: "Bearer " + config.jwt }
    };
    try {
      const response = await fetch(config.url + path, requestOptions);
      if (!response.ok) await this.throwApiError(response);
    } catch (e) {
      console.log(e)
      throw (e);
    }
  }

  static async postAnonymous(path: string, data: any[] | {}, apiName: ApiListType) {
    const config = this.getConfig(apiName);
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
    return await this.fetchWithErrorHandling(config.url + path, requestOptions);
  }

  static async fetchWithErrorHandling(url: string, requestOptions: any) {
    try {
      const response = await fetch(url, requestOptions);
      if (!response.ok) await this.throwApiError(response);
      else {
        if (response.status !== 204 ) {
          return response.json();
        }
      }
    } catch (e) {
      console.log("Error loading url: " + url);
      console.log(e)
      throw (e);
    }
  }

  private static async throwApiError(response: Response) {
    let msg = response.statusText;
    try {
      const json = await response.json();
      msg = json.errors[0];
    } catch { }
    throw new Error(msg || "Error");
  }

}
