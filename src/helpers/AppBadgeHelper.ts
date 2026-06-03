type BadgingNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

const normalizeBadgeCount = (count: number) => {
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.trunc(count));
};

export const setAppBadge = async (count: number) => {
  if (typeof navigator === "undefined") return;

  const nav = navigator as BadgingNavigator;
  const normalized = normalizeBadgeCount(count);

  if (normalized === 0) {
    await clearAppBadge();
    return;
  }

  if (!("setAppBadge" in navigator) || typeof nav.setAppBadge !== "function") return;

  try {
    await nav.setAppBadge(normalized);
  } catch {
    // Badging is best-effort.
  }
};

export const clearAppBadge = async () => {
  if (typeof navigator === "undefined") return;

  const nav = navigator as BadgingNavigator;
  if (!("clearAppBadge" in navigator) || typeof nav.clearAppBadge !== "function") return;

  try {
    await nav.clearAppBadge();
  } catch {
    // Badging is best-effort.
  }
};

export const AppBadgeHelper = {
  setAppBadge,
  clearAppBadge
};
