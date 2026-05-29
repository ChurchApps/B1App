const isSupported = () => typeof navigator !== "undefined" && "setAppBadge" in navigator;

export const AppBadgeHelper = {
  setAppBadge: async (count: number) => {
    if (!isSupported()) return;
    try {
      if (count > 0) await (navigator as any).setAppBadge(count);
      else await (navigator as any).clearAppBadge();
    } catch {
      // Ignore: badging is best-effort and must not break notification handling.
    }
  },
  clearAppBadge: async () => {
    if (!isSupported()) return;
    try {
      await (navigator as any).clearAppBadge();
    } catch {
      // Ignore.
    }
  }
};
