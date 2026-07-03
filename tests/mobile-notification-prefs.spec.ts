import { test, expect, type Page, type Locator } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Taxonomy in Api/src/modules/messaging/helpers/NotificationCategoryHelper.ts (all tier 1).
// Grid paints after GET /my; anchor on known category before interacting.
async function gotoPrefs(page: Page) {
  await page.goto("/mobile/notificationPrefs");
  await expect(mobileLogoutButton(page)).toBeVisible();
  const main = page.locator("main");
  await expect(main.getByText("Church Announcements", { exact: true })).toBeVisible({ timeout: 30000 });
  return main;
}

function categoryRow(main: Locator, displayName: string): Locator {
  return main.locator("tr").filter({ hasText: displayName });
}

test.describe("Mobile notification preferences", () => {
  test("entry card on the notifications page opens the prefs screen", async ({ page }) => {
    await page.goto("/mobile/notifications");
    await expect(mobileLogoutButton(page)).toBeVisible();
    const main = page.locator("main");
    const entry = main.getByText("Notification Preferences", { exact: true });
    await entry.waitFor({ state: "visible", timeout: 15000 });
    await entry.click();
    await page.waitForURL((url) => url.pathname.includes("/mobile/notificationPrefs"), { timeout: 30000 });
    await expect(main.getByText("Church Announcements", { exact: true })).toBeVisible({ timeout: 30000 });
  });

  test("prefs screen renders global controls and the category grid", async ({ page }) => {
    const main = await gotoPrefs(page);
    await expect(main.getByText("Global Controls", { exact: true })).toBeVisible();
    await expect(main.getByText("Mute all notifications", { exact: true })).toBeVisible();
    await expect(main.getByText("Push notifications", { exact: true })).toBeVisible();
    await expect(main.getByText("Quiet Hours", { exact: true })).toBeVisible();
    await expect(main.getByText("Notification Categories", { exact: true })).toBeVisible();
    // Email-frequency Select uses labelId="email-freq-label".
    await expect(main.getByLabel("Email frequency")).toBeVisible();
    await expect(main.getByRole("columnheader", { name: "Push" })).toBeVisible();
    await expect(main.getByRole("columnheader", { name: "Email" })).toBeVisible();
    await expect(main.getByRole("columnheader", { name: "In-App" })).toBeVisible();
    await expect(main.getByText("Tasks & Follow-Ups", { exact: true })).toBeVisible();
    await expect(main.getByRole("button", { name: "Save Preferences" })).toBeVisible();
  });

  test("no category rows are locked (current taxonomy is all tier-1)", async ({ page }) => {
    const main = await gotoPrefs(page);
    await expect(main.locator('svg[data-testid="LockIcon"]')).toHaveCount(0);
    const row = categoryRow(main, "Tasks & Follow-Ups");
    const boxes = row.locator('input[type="checkbox"]');
    const count = await boxes.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(boxes.nth(i)).toBeEnabled();
    }
  });

  // Mutating test; reset-demo wipes changes.
  test.describe.serial("save round-trips category and global changes", () => {
    test("turning off Church Announcements email + email frequency persists after reload", async ({ page }) => {
      const main = await gotoPrefs(page);

      const annRow = categoryRow(main, "Church Announcements");
      const annEmail = annRow.locator('input[type="checkbox"]').nth(1);
      await expect(annEmail).toBeEnabled();
      await expect(annEmail).toBeChecked();
      await annEmail.uncheck();
      await expect(annEmail).not.toBeChecked();

      const freq = main.getByLabel("Email frequency");
      await freq.click();
      await page.getByRole("option", { name: "Daily digest" }).click();
      await expect(main.getByLabel("Email frequency")).toContainText("Daily digest");

      await main.getByRole("button", { name: "Save Preferences" }).click();
      await expect(page.getByText("Preferences saved.")).toBeVisible({ timeout: 15000 });

      // IndexedDB caching prevents refetch; clear to force fresh GET /my.
      await page.evaluate(async () => {
        for (const db of await indexedDB.databases()) if (db.name) indexedDB.deleteDatabase(db.name);
      });

      const reloaded = await gotoPrefs(page);
      const annEmail2 = categoryRow(reloaded, "Church Announcements").locator('input[type="checkbox"]').nth(1);
      await expect(annEmail2).not.toBeChecked();
      await expect(reloaded.getByLabel("Email frequency")).toContainText("Daily digest");
    });
  });
});
