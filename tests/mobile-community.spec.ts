import { test, expect } from "@playwright/test";
import { SEED_PEOPLE } from "./helpers/fixtures";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile community", () => {
  test("community page renders Search Members input", async ({ page }) => {
    await page.goto("/mobile/community");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /Search Members/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("searching for a seeded person returns a result", async ({ page }) => {
    await page.goto("/mobile/community");
    const search = page.getByRole("textbox", { name: /Search Members/i });
    await search.waitFor({ state: "visible", timeout: 15000 });
    await expect(page.locator("main")).toContainText(/Clark|Jackson|Williams|Moore/i, { timeout: 30000 });
    await search.fill("Donald");
    await expect(page.locator("main")).toContainText(/Donald/, { timeout: 15000 });
  });

  test("legacy /mobile/membersSearch slug redirects to /mobile/community", async ({ page }) => {
    await page.goto("/mobile/membersSearch");
    await expect(page).toHaveURL(/\/mobile\/community/);
  });

  test("tapping a member opens their profile", async ({ page }) => {
    await page.goto("/mobile/community");
    const search = page.getByRole("textbox", { name: /Search Members/i });
    await search.waitFor({ state: "visible", timeout: 15000 });
    await expect(page.locator("main")).toContainText(/Clark|Jackson|Williams|Moore/i, { timeout: 30000 });
    await search.fill("Donald");
    const row = page.locator("main").getByText("Donald").first();
    await row.waitFor({ state: "visible", timeout: 15000 });
    await row.click();
    await expect(page).toHaveURL(/\/mobile\/community\/PER\d+/, { timeout: 15000 });
    await expect(page.locator("body")).toContainText(SEED_PEOPLE.DONALD.split(" ")[0]);
  });

  test("member detail page shows household members", async ({ page }) => {
    // Donald Clark (PER00000080) with spouse Carol (PER00000081).
    await page.goto("/mobile/community/PER00000080");
    await expect(mobileLogoutButton(page)).toBeVisible();
    const main = page.locator("main");
    await expect(main).toContainText(/Donald/, { timeout: 30000 });
    await expect(main).toContainText(/Carol/);
  });
});
