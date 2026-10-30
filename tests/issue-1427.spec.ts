import { test, expect, type Page } from "@playwright/test";

// Issue #1427: on a server with no push keys (a default self-hosted install, and the local
// demo Api) the app offered "Finish notification setup" and a Retry that could never work.
// The local demo Api has blank WEB_PUSH_* keys, so it answers { publicKey: "", enabled: false }.
const FINISH_TITLE = "Finish notification setup";
const ENABLE_BUTTON = "Enable Notifications";
const DISABLED_TEXT = /aren't turned on for this site/;

// Push APIs only exist on a secure origin and the demo site is plain http, so stand in for
// the browser side. The key request still goes to the demo Api.
const stubBrowserPush = (page: Page, permission: NotificationPermission) => page.addInitScript((perm) => {
  Object.defineProperty(navigator, "serviceWorker", { value: { getRegistration: async () => undefined, register: async () => undefined, addEventListener: () => {}, removeEventListener: () => {} } });
  Object.defineProperty(Notification, "permission", { get: () => perm });
}, permission);

const gotoHomeAndSettle = async (page: Page) => {
  const publicKey = page.waitForResponse((r) => r.url().includes("/webpush/publicKey"));
  await page.goto("/mobile/dashboard");
  expect(await (await publicKey).json()).toMatchObject({ enabled: false });
  await page.waitForLoadState("networkidle");
};

test.describe("Push notifications when the server has no push keys", () => {
  test("Home offers no Retry once permission is granted", async ({ page }) => {
    await stubBrowserPush(page, "granted");
    await gotoHomeAndSettle(page);
    await expect(page.getByText(FINISH_TITLE)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry Registration" })).toHaveCount(0);
  });

  test("Home does not ask for permission that could never deliver", async ({ page }) => {
    await stubBrowserPush(page, "default");
    await gotoHomeAndSettle(page);
    await expect(page.getByRole("button", { name: ENABLE_BUTTON })).toHaveCount(0);
  });

  test("Notifications says an administrator has to add the keys, with no Retry", async ({ page }) => {
    await stubBrowserPush(page, "granted");
    await page.goto("/mobile/notifications");
    await expect(page.getByText(DISABLED_TEXT)).toBeVisible();
    await expect(page.getByText("Retry", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Turn on", { exact: true })).toHaveCount(0);
  });

  test("a failed key request still offers Retry", async ({ page }) => {
    await stubBrowserPush(page, "granted");
    await page.route("**/webpush/publicKey", (route) => route.abort());
    await page.goto("/mobile/dashboard");
    await expect(page.getByText(FINISH_TITLE)).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry Registration" })).toBeVisible();
  });
});
