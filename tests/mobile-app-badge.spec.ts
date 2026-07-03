import { test, expect } from "@playwright/test";

// Badging API foreground path only; background (service worker) cannot be tested in Playwright (serviceWorkers: 'block').
// Recorded via addInitScript so we can assert what the app requested.

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

    // NaN/undefined would throw TypeError from setAppBadge on iOS.
    await expect.poll(async () => page.evaluate(() => ((window as any).__appBadge || []).length)).toBeGreaterThan(0);
    const allNumeric = await page.evaluate(() => ((window as any).__appBadge || []).every((v: any) => typeof v === "number" && Number.isFinite(v)));
    expect(allNumeric).toBe(true);
  });
});
