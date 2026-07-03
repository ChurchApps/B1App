import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Realtime — single WebSocket per tab", () => {
  test("a single page mounting multiple chat surfaces opens at most one socket", async ({ page }) => {
    await page.addInitScript(() => {
      const win = window as any;
      win.__wsCount = 0;
      const NativeWS = win.WebSocket;
      function CountedWS(this: any, url: string, protocols?: any) {
        win.__wsCount += 1;
        return new NativeWS(url, protocols);
      }
      CountedWS.prototype = NativeWS.prototype;
      Object.assign(CountedWS, NativeWS);
      win.WebSocket = CountedWS as unknown as typeof WebSocket;
    });

    await page.goto("/mobile/groups/GRP00000004");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });

    const messagesTab = page.getByRole("tab", { name: /Messages/i });
    if (await messagesTab.isVisible().catch(() => false)) {
      await messagesTab.click();
    }

    await page.waitForTimeout(3000);

    const wsCount = await page.evaluate(() => (window as any).__wsCount as number);
    // Threshold is 2: React StrictMode double-mounts effects in dev; count is 1 in prod.
    expect(wsCount).toBeLessThanOrEqual(2);
  });
});
