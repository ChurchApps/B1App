// The church's ga4MeasurementId is church-editable and lands in an inline
// script, so only a valid GA4 id gets through (the G- half of
// isAllowedMeasurementId). GTM container ids can't take gtag('config'), so
// they stay website-only.
const GA4_ID = /^G-[A-Z0-9-]+$/;

export const churchAppMeasurementId = (id?: string | null): string | null => {
  const trimmed = id?.trim();
  return trimmed && GA4_ID.test(trimmed) ? trimmed : null;
};

export const mobileAnalyticsIds = (appGaId?: string | null, churchGaId?: string | null): string[] => {
  const ids: string[] = [];
  if (appGaId) ids.push(appGaId);
  const churchId = churchAppMeasurementId(churchGaId);
  if (churchId && !ids.includes(churchId)) ids.push(churchId);
  return ids;
};

// Same check as the b1-install-prompt script in the mobile layout.
const DISPLAY_MODE_EXPR = "((window.navigator&&window.navigator.standalone===true)||(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches))?'installed':'browser'";

type DisplayModeWindow = { navigator?: object, matchMedia?: (q: string) => { matches: boolean } };

export const appDisplayMode = (win: DisplayModeWindow): "installed" | "browser" => {
  try {
    if ((win.navigator as { standalone?: boolean } | undefined)?.standalone === true) return "installed";
    if (win.matchMedia && win.matchMedia("(display-mode: standalone)").matches) return "installed";
  } catch { /* treat as browser */ }
  return "browser";
};

export const mobileAnalyticsInitScript = (ids: string[]): string => {
  const configs = ids.map((id) => `gtag('config','${id}',{display_mode:dm});`).join("");
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}var dm=${DISPLAY_MODE_EXPR};gtag('js',new Date());${configs}`;
};
