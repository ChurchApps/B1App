import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Demo user (PER00000082, demo@b1.church) is seeded as a member of:
//   - GRP00000001 Sunday Morning Service
//   - GRP00000004 Adult Bible Class
//   - GRP00000016 Men's Bible Study
// (membership/demo.sql:442-450)

test.describe("Mobile groups", () => {
  test("groups page loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/groups");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("shows demo user's seeded group memberships", async ({ page }) => {
    await page.goto("/mobile/groups");
    const body = page.locator("body");
    await expect(body).toContainText(/Sunday Morning Service|Adult Bible Class|Men's Bible Study/i, {
      timeout: 15000,
    });
  });

  test("legacy /mobile/myGroups slug routes to groups", async ({ page }) => {
    await page.goto("/mobile/myGroups");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("tapping a group card navigates to its detail page", async ({ page }) => {
    await page.goto("/mobile/groups");
    const card = page.locator("main").getByText(/Adult Bible Class/i).first();
    await card.waitFor({ state: "visible", timeout: 15000 });
    await card.click();
    await expect(page).toHaveURL(/\/mobile\/groups\/GRP\d+/, { timeout: 15000 });
  });

  test("group detail page loads About tab and member-visible Messages tab", async ({ page }) => {
    // Demo user is a member of GRP00000004 (Adult Bible Class), so the
    // Messages tab should be available alongside the always-visible tabs.
    await page.goto("/mobile/groups/GRP00000004");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.getByRole("tab", { name: /About/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("tab", { name: /Messages/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Members/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Events/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Resources/i })).toBeVisible();
  });

  test("group detail About tab shows the group description", async ({ page }) => {
    await page.goto("/mobile/groups/GRP00000004");
    // GRP00000004 'about' field per membership/demo.sql:246 is
    // "In-depth Bible study for adults of all ages."
    await expect(page.locator("main")).toContainText(/Bible study for adults/i, {
      timeout: 15000,
    });
  });
});
