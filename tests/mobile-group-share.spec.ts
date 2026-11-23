import { test, expect } from "@playwright/test";

// A group's Share sheet shows the group's page as a QR code and a link. Whoever opens that link
// lands on the group's page and uses the existing Join / Request to Join from there.

const GROUP_ID = "GRP00000004"; // Adult Bible Class
const GROUP_SLUG = "adult-bible-class";

test.describe("Mobile group share", () => {
  test("shows the group link as a QR code and copies it", async ({ page }) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await page.getByTestId("group-share-button").click();
    const sheet = page.getByTestId("group-share-sheet");
    await expect(sheet).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("group-share-qr")).toBeVisible();
    await expect(page.getByTestId("group-share-url")).toHaveText(new RegExp(`/mobile/groups/${GROUP_SLUG}$`));
    await page.getByTestId("group-share-copy").click();
    await expect(page.getByText("Link copied to clipboard")).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toMatch(new RegExp(`/mobile/groups/${GROUP_SLUG}$`));
    await page.screenshot({ path: ".pr-screenshots/after.png", animations: "disabled" });
  });

  test.describe("signed out", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("the shared link opens the group's page with its join action", async ({ page }) => {
      await page.goto(`/mobile/groups/${GROUP_SLUG}`);
      await expect(page.getByRole("heading", { name: "Adult Bible Class" })).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("anonymous-group-sign-in")).toBeVisible();
    });
  });
});
