import { ApiHelper } from "./ApiHelper"

export interface AppearanceInterface { primaryColor?: string, primaryContrast?: string, secondaryColor?: string, secondaryContrast?: string, logoLight?: string, logoDark?: string }

export class AppearanceHelper {

  static current: AppearanceInterface;

  public static async load(churchId: string) {
    if (!AppearanceHelper.current) AppearanceHelper.current = await ApiHelper.getAnonymous("/settings/public/" + churchId, "AccessApi");
    return this.current;
  }

  public static getLogoDark(appearanceSettings: AppearanceInterface, defaultLogo: string) {
    return (appearanceSettings?.logoDark) ? appearanceSettings.logoDark : defaultLogo;
  }

  public static getLogoLight(appearanceSettings: AppearanceInterface, defaultLogo: string) {
    return (appearanceSettings?.logoLight) ? appearanceSettings.logoLight : defaultLogo;
  }

  public static getLogo(appearanceSettings: AppearanceInterface, defaultLogoLight: string, defaultLogoDark: string, backgroundColor: string) {
    const isDark = (appearanceSettings.logoDark) ? this.isDark(backgroundColor) : false;
    if (isDark) return this.getLogoDark(appearanceSettings, defaultLogoDark);
    else return this.getLogoLight(appearanceSettings, defaultLogoLight);
  }

  private static isDark(backgroundColor: string) {
    let valid = false;
    let r = 0;
    let g = 0;
    let b = 0;

    if (backgroundColor.match(/#[0-9a-fA-F{6}]/)) {
      r = this.getHexValue(backgroundColor.substring(1, 2));
      g = this.getHexValue(backgroundColor.substring(3, 4));
      b = this.getHexValue(backgroundColor.substring(5, 6));
      valid = true;
    } else if (backgroundColor.match(/#[0-9a-fA-F{3}]/)) {
      r = this.getHexValue(backgroundColor.substring(1, 1));
      g = this.getHexValue(backgroundColor.substring(2, 2));
      b = this.getHexValue(backgroundColor.substring(3, 3));
      valid = true;
    }

    if (!valid) return false;
    else {
      //HSP brightness formula.  Some colors have a bigger impact on our perceived brightness than others.
      const rWeight = .299 * Math.pow(r, 2);
      const gWeight = .587 * Math.pow(g, 2);
      const bWeight = .114 * Math.pow(b, 2);
      const brightness = Math.sqrt(rWeight + gWeight + bWeight);
      //return brightness < 128;  //
      return brightness < 156;
    }

  }

  private static getHexValue(hex: string) {
    let result = parseInt(hex, 16);
    if (hex.length === 1) result = result * 16;
    return result;
  }

}
