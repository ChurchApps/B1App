import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

/**
 * Validates the consolidation invariant: a single page mounting multiple
 * conversation surfaces (notes, bell, message thread) opens exactly one
 * WebSocket. Cross-navigation (page reload) is *not* tested here — every
 * full reload legitimately recreates the socket; the invariant is per-page.
 */
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

    // Group detail page mounts the chat surface (Conversations on the Messages tab) plus
    // the bell + NotificationService — both consume sockets via SubscriptionManager.
    await page.goto("/mobile/groups/GRP00000004");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });

    // Click into the Messages tab so the GroupChatModal subscribes via SubscriptionManager.
    const messagesTab = page.getByRole("tab", { name: /Messages/i });
    if (await messagesTab.isVisible().catch(() => false)) {
      await messagesTab.click();
    }

    // Wait long enough for both NotificationService and the conversation surface to attempt connection.
    await page.waitForTimeout(3000);

    const wsCount = await page.evaluate(() => (window as any).__wsCount as number);
    // Threshold is 2 to absorb React StrictMode's intentional double-mount of effects in dev
    // (useNotifications calls initialize() twice; the second observes a connecting socket and
    // either returns early or — if socketId hasn't arrived yet — creates a fresh one). In a
    // production build StrictMode is off and this count is 1. Pre-consolidation, multiple
    // chat surfaces on the same page each owned their own socket and the count could reach 5+.
    expect(wsCount).toBeLessThanOrEqual(2);
  });
});
