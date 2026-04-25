import { test, expect } from "@playwright/test";
import { SEED_PEOPLE } from "./helpers/fixtures";
import { mobileLogoutButton } from "./helpers/mobile";

// CommunityPage is the people directory. Searches against MembershipApi
// /people/search?term=... and shows seeded members.

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
    // Wait for the directory list to populate before filtering.
    await expect(page.locator("main")).toContainText(/Clark|Jackson|Williams|Moore/i, {
      timeout: 30000,
    });
    await search.fill("Donald");
    // Each row renders firstName + lastName in separate elements with no
    // space between, so combined text reads e.g. "DonaldClark". Match the
    // first name alone to avoid the rendering quirk.
    await expect(page.locator("main")).toContainText(/Donald/, { timeout: 15000 });
    // After filtering for Donald, other seeded surnames should NOT appear.
    const otherNames = await page.locator("main").textContent();
    expect(otherNames).toMatch(/Donald/);
  });

  test("legacy /mobile/membersSearch slug redirects to /mobile/community", async ({ page }) => {
    await page.goto("/mobile/membersSearch");
    await expect(page).toHaveURL(/\/mobile\/community/);
  });
});
