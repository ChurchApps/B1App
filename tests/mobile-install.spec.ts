import { test, expect } from "@playwright/test";

// The desktop install page must render its mobile.install.* labels, not raw keys
// such as "mobile.install.desktopTitle" or "mobile.install.mockupSermon".
test.describe("Mobile install page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("desktop install page shows translated text, not raw keys", async ({ page }) => {
    await page.goto("/mobile/install");
    await expect(page.getByText("Scan with your phone camera")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Install on your phone" })).toBeVisible();
    await expect(page.getByText("Sunday Sermon")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("mobile.install.");
  });
});
