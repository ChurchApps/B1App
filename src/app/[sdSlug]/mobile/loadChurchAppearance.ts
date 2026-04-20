import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";

export interface ChurchAppearance {
  churchId?: string;
  churchName?: string;
  primaryColor?: string;
  favicon?: string;
}

export async function loadChurchAppearance(sdSlug: string): Promise<ChurchAppearance> {
  EnvironmentHelper.init();
  const base = EnvironmentHelper.Common.MembershipApi;
  if (!base) return {};

  try {
    const churchRes = await fetch(
      `${base}/churches/lookup/?subDomain=${encodeURIComponent(sdSlug)}`,
      { next: { revalidate: 3600 } }
    );
    if (!churchRes.ok) return {};
    const church = await churchRes.json();
    if (!church?.id) return { churchName: church?.name };

    const appearanceRes = await fetch(
      `${base}/settings/public/${church.id}`,
      { next: { revalidate: 3600 } }
    );
    if (!appearanceRes.ok) {
      return { churchId: church.id, churchName: church.name };
    }
    const appearance = await appearanceRes.json();
    return {
      churchId: church.id,
      churchName: church.name,
      primaryColor: appearance?.primaryColor,
      favicon: appearance?.favicon_400x400 || appearance?.favicon_16x16
    };
  } catch {
    return {};
  }
}
