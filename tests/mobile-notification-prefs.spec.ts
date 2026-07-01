import { test, expect, type Page, type Locator } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Notification Preference Center — src/app/[sdSlug]/mobile/components/screens/
// NotificationPrefsPage.tsx at /mobile/notificationPrefs. The category taxonomy
// (tiers / locked flags / allowed channels) is the single source of truth in
// Api/src/modules/messaging/helpers/NotificationCategoryHelper.ts:
//   - tier 0 (locked): "Account & Security", "Giving Receipts & Statements",
//     "Check-In Safety Alerts" — checkboxes rendered DISABLED with a lock icon.
//   - tier 1 "Church Announcements" defaults email ON, so it can be toggled OFF
//     and the override round-trips through GET /messaging/notificationpreferences/my.
// Columns render in order Push / Email / In-App (SMS hidden), so the email
// checkbox is the 2nd input in a category row.

// The category grid only paints after the GET /my query resolves. Anchor on a
// known category before interacting with any row.
async function gotoPrefs(page: Page) {
  await page.goto("/mobile/notificationPrefs");
  await expect(mobileLogoutButton(page)).toBeVisible();
  const main = page.locator("main");
  await expect(main.getByText("Church Announcements", { exact: true })).toBeVisible({ timeout: 30000 });
  return main;
}

// The checkboxes for a category live in the same MUI TableRow as its name.
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
    // Column headers + a tier-1 and a tier-0 category prove the grid painted.
    await expect(main.getByRole("columnheader", { name: "Push" })).toBeVisible();
    await expect(main.getByRole("columnheader", { name: "Email" })).toBeVisible();
    await expect(main.getByRole("columnheader", { name: "In-App" })).toBeVisible();
    await expect(main.getByText("Account & Security", { exact: true })).toBeVisible();
    await expect(main.getByRole("button", { name: "Save Preferences" })).toBeVisible();
  });

  test("tier-0 (locked) category row has disabled channel toggles", async ({ page }) => {
    const main = await gotoPrefs(page);
    // "Account & Security" is tier 0 (locked); its push/email/in_app checkboxes
    // are rendered but disabled, and the row shows a lock icon (LockIcon ->
    // svg[data-testid="LockIcon"]).
    const row = categoryRow(main, "Account & Security");
    await expect(row.locator('svg[data-testid="LockIcon"]')).toBeVisible();
    const boxes = row.locator('input[type="checkbox"]');
    const count = await boxes.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(boxes.nth(i)).toBeDisabled();
    }
  });

  // Mutating: writes an override row + global change. Pretest reset-demo (and the
  // workflow's pre-run reset) wipes it before the next run.
  test.describe.serial("save round-trips category and global changes", () => {
    test("turning off Church Announcements email + email frequency persists after reload", async ({ page }) => {
      const main = await gotoPrefs(page);

      // Tier-1 "Church Announcements": Push / Email / In-App checkboxes (SMS
      // hidden). Email (2nd input) defaults ON.
      const annRow = categoryRow(main, "Church Announcements");
      const annEmail = annRow.locator('input[type="checkbox"]').nth(1);
      await expect(annEmail).toBeEnabled();
      await expect(annEmail).toBeChecked();
      await annEmail.uncheck();
      await expect(annEmail).not.toBeChecked();

      // Change a global control: email frequency individual -> Daily digest.
      const freq = main.getByLabel("Email frequency");
      await freq.click();
      await page.getByRole("option", { name: "Daily digest" }).click();
      await expect(main.getByLabel("Email frequency")).toContainText("Daily digest");

      await main.getByRole("button", { name: "Save Preferences" }).click();
      await expect(page.getByText("Preferences saved.")).toBeVisible({ timeout: 15000 });

      // MobileQueryProvider persists the react-query cache to IndexedDB
      // (offline-first, staleTime 60s), so a same-context reload rehydrates the
      // pre-save snapshot and never refetches. Clear the persisted cache to
      // force a fresh GET /my — the same clean-slate a brand-new session sees.
      await page.evaluate(async () => {
        for (const db of await indexedDB.databases()) if (db.name) indexedDB.deleteDatabase(db.name);
      });

      // Reload: the GET /my round-trip must reflect the saved override + global.
      const reloaded = await gotoPrefs(page);
      const annEmail2 = categoryRow(reloaded, "Church Announcements").locator('input[type="checkbox"]').nth(1);
      await expect(annEmail2).not.toBeChecked();
      await expect(reloaded.getByLabel("Email frequency")).toContainText("Daily digest");
    });
  });
});
