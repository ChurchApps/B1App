import { test, expect } from "@playwright/test";

test.describe("Mobile groups — request-to-join UX", () => {
  const NON_MEMBER_GROUP_ID = "GRP00000005";

  test("non-member sees join button on an open-policy group", async ({ page }) => {
    await page.goto(`/mobile/groups/${NON_MEMBER_GROUP_ID}`);
    await expect(page.getByRole("tab", { name: /About/i })).toBeVisible({ timeout: 15000 });
    const joinBtn = page.locator('[data-testid="join-group-button"]');
    await expect(joinBtn).toBeVisible({ timeout: 10000 });
    await expect(joinBtn).toHaveText(/Join Group/i);
  });

  test("my-groups page renders a pending-requests slot even when empty", async ({ page }) => {
    await page.goto("/mobile/groups");
    await expect(page.locator("main")).toContainText(/Sunday Morning Service|Adult Bible Class|Men's Bible Study/i, { timeout: 15000 });
    await expect(page.locator('[data-testid="my-pending-requests"]')).toHaveCount(0);
  });
});
