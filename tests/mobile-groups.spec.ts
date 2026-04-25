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
    // GroupsPage uses react-query — wait for the list to populate.
    await expect(body).toContainText(/Sunday Morning Service|Adult Bible Class|Men's Bible Study/i, {
      timeout: 15000,
    });
  });

  test("legacy /mobile/myGroups slug routes to groups", async ({ page }) => {
    await page.goto("/mobile/myGroups");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });
});
