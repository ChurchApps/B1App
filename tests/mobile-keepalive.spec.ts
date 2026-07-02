import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// The mobile layout keeps visited tab screens mounted with React's <Activity>,
// so transient UI state (form inputs, scroll) survives tab switches. Hidden
// Activity subtrees stay in the DOM (display:none), so assert with getByRole /
// visible locators, which ignore them.

test.describe("Mobile keep-alive", () => {
  test("community search input keeps its value across a tab switch", async ({ page }) => {
    await page.goto("/mobile/community");
    await expect(mobileLogoutButton(page)).toBeVisible();

    const search = page.getByRole("textbox", { name: /Search Members/i });
    await search.waitFor({ state: "visible", timeout: 15000 });
    await search.fill("Donald");
    await expect(page.locator("main")).toContainText(/Donald/, { timeout: 15000 });

    const nav = page.getByRole("navigation", { name: /Main navigation/i });
    await nav.getByRole("link", { name: /^Sermons$/i }).first().click();
    await expect(page).toHaveURL(/\/mobile\/sermons/, { timeout: 15000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/mobile\/community/, { timeout: 15000 });

    // getByRole targets the visible instance; a remount would have reset this.
    await expect(page.getByRole("textbox", { name: /Search Members/i })).toHaveValue("Donald", {
      timeout: 15000,
    });
  });

  test("sermons scroll position is restored after a tab switch", async ({ page }) => {
    await page.goto("/mobile/sermons");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Sermons|Playlists|Sunday/i, { timeout: 20000 });

    await page.evaluate(() => window.scrollTo(0, 800));
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 10000 }).toBeGreaterThan(400);

    const nav = page.getByRole("navigation", { name: /Main navigation/i });
    await nav.getByRole("link", { name: /^Bible$/i }).first().click();
    await expect(page).toHaveURL(/\/mobile\/bible/, { timeout: 15000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/mobile\/sermons/, { timeout: 15000 });

    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 10000 }).toBeGreaterThan(400);
  });
});
