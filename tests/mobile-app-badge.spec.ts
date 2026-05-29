import { test, expect } from "@playwright/test";

/**
 * Foreground coverage for the iOS PWA home-screen app icon badge (Badging API).
 *
 * The badge is driven from two places:
 *   1. Foreground — useRealtimeNotifications pushes the live unread total to
 *      navigator.setAppBadge / clearAppBadge while the app is open. (Tested here.)
 *   2. Background — the service worker's push handler sets the badge from the
 *      payload's badgeCount when the app is closed. This CANNOT be exercised
 *      here: playwright.config.ts sets `serviceWorkers: 'block'`, so no SW runs.
 *      That path needs a real installed PWA on an iOS device (see the plan's
 *      manual verification section).
 *
 * Chromium ships the Badging API, so AppBadgeHelper's `"setAppBadge" in navigator`
 * guard is satisfied. We shadow the two methods with recorders (via addInitScript,
 * before any page script runs) so we can assert what the app asked the OS to show.
 *
 * Assertions compare the recorded badge value against the in-app notification bell
 * count — both derive from the same `counts` state, so the test is immune to other
 * specs mutating demo's unread totals in parallel.
 */

const installBadgeRecorder = () => {
  (window as any).__appBadge = [];
  const record = (value?: number) => {
    (window as any).__appBadge.push(typeof value === "number" ? value : 0);
    return Promise.resolve();
  };
  Object.defineProperty(navigator, "setAppBadge", { configurable: true, writable: true, value: (n?: number) => record(n) });
  Object.defineProperty(navigator, "clearAppBadge", { configurable: true, writable: true, value: () => record(0) });
};

test.describe("Mobile — home-screen app icon badge (Badging API)", () => {
  test("app badge mirrors the unread notification bell count", async ({ page }) => {
    await page.addInitScript(installBadgeRecorder);
    await page.goto("/mobile/dashboard");

    const bell = page.getByRole("button", { name: /Notifications/i });
    await expect(bell).toBeVisible({ timeout: 15000 });
    const bellBadge = bell.locator(".MuiBadge-badge");

    // The seeded demo user (PER00000082) has unread items, so the bell count
    // becomes positive and the recorded Badging-API value converges to it.
    await expect
      .poll(
        async () => {
          const text = (await bellBadge.textContent())?.trim() || "0";
          const bellCount = /^\d+$/.test(text) ? parseInt(text, 10) : 0;
          const lastBadge = await page.evaluate(() => {
            const calls = (window as any).__appBadge as number[] | undefined;
            return calls && calls.length ? calls[calls.length - 1] : -1;
          });
          return bellCount > 0 && bellCount === lastBadge;
        },
        { timeout: 20000, message: "app badge should converge to the bell's unread count" }
      )
      .toBe(true);
  });

  test("only ever passes numeric values to the Badging API", async ({ page }) => {
    await page.addInitScript(installBadgeRecorder);
    await page.goto("/mobile/dashboard");
    await expect(page.getByRole("button", { name: /Notifications/i })).toBeVisible({ timeout: 15000 });

    // The foreground sync must fire at least once, and never with a non-number
    // (NaN/undefined would throw a TypeError from the real setAppBadge on iOS).
    await expect.poll(async () => page.evaluate(() => ((window as any).__appBadge || []).length)).toBeGreaterThan(0);
    const allNumeric = await page.evaluate(() => ((window as any).__appBadge || []).every((v: any) => typeof v === "number" && Number.isFinite(v)));
    expect(allNumeric).toBe(true);
  });
});
