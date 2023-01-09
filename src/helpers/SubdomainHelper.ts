export class SubdomainHelper {
  static subDomain = "";

  static getRelativePath(path: string) {
    return "/" + this.subDomain + path;
  }
}
