import { test, expect } from "@playwright/test";

// Issue 1143: the 2026-09-21 locale sync pruned mobile.install.* keys that the
// install page still uses, so the desktop view printed raw keys such as
// "mobile.install.desktopTitle" and "mobile.install.mockupSermon".
test.describe("Issue 1143 — install page labels", () => {
  test("desktop install page shows translated text, not raw keys", async ({ page }) => {
    await page.goto("/mobile/install");
    await expect(page.getByText("Scan with your phone camera")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Install on your phone" })).toBeVisible();
    await expect(page.getByText("Sunday Sermon")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("mobile.install.");
  });
});
