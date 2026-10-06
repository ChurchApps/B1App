import { test, expect, type Page } from "@playwright/test";

// Issue 1201: "Show volunteer names on signup page" is on for the demo plan
// PLA00000001 (Upcoming Worship Schedule; the column defaults to on), and Emily
// Davis holds the Coffee Host slot (ASS00000010). The signup page only showed
// filled/needed counts, so members could never see who had already signed up.
const PLAN_ID = "PLA00000001";

async function loginAs(page: Page, email: string) {
  await page.goto("/login", { timeout: 60000 });
  await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

test.describe("Issue 1201 — volunteer names on the signup page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("a signed-in member sees who already signed up for a position", async ({ page }) => {
    await loginAs(page, "volunteer@b1.church");
    await page.goto(`/mobile/volunteer/${PLAN_ID}`, { timeout: 60000 });

    await expect(page.getByText("Coffee Host", { exact: true })).toBeVisible({ timeout: 30000 });
    // Nothing else on this page names Emily Davis; she can only appear as Coffee Host's volunteer.
    await expect(page.getByText(/Emily Davis/)).toBeVisible({ timeout: 15000 });
  });
});
