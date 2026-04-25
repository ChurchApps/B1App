import { test, expect } from "@playwright/test";
import { SEED_PEOPLE } from "./helpers/fixtures";

// CommunityPage is the people directory. Searches against MembershipApi
// /people/search?term=... and shows seeded members.

test.describe("Mobile community", () => {
  test("community page renders search input", async ({ page }) => {
    await page.goto("/mobile/community");
    await expect(page.locator('[data-testid="user-menu-chip"]')).toBeVisible();
    // The search input is the only required element on first render.
    await expect(page.locator('input[placeholder*="Search" i], input[type="search"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("searching for a seeded person returns a result", async ({ page }) => {
    await page.goto("/mobile/community");
    const search = page.locator('input[placeholder*="Search" i], input[type="search"]').first();
    await search.waitFor({ state: "visible", timeout: 10000 });
    await search.fill(SEED_PEOPLE.DONALD);
    // Wait for the result to appear — search debounces, so allow ~1.5s.
    await expect(page.locator("body")).toContainText(SEED_PEOPLE.DONALD, { timeout: 8000 });
  });

  test("legacy /mobile/membersSearch slug redirects to /mobile/community", async ({ page }) => {
    await page.goto("/mobile/membersSearch");
    await expect(page).toHaveURL(/\/mobile\/community/);
  });
});
