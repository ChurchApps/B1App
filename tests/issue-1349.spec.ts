import { test, expect } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// Issue #1349: the Me page's serving rows read "12:00 AM" because plans only store a date,
// and the public form page showed the admin "Edit Form" card header to visitors.
test.describe("Me page serving rows", () => {
  // Demo church is in Central time; plans store a date only, so the row used to show a made-up time (12:00 AM in prod).
  test.use({ timezoneId: "America/Chicago" });

  test("show the service time, not midnight", async ({ page }) => {
    await page.goto("/mobile/me?view=upcoming");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const servingRow = page.getByTestId("me-item-serving").filter({ hasText: "Sound Tech" });
    await expect(servingRow).toBeVisible({ timeout: 15000 });
    // demo.sql seeds the plan's service time at 10:00 on the service date.
    await expect(servingRow).toContainText("10:00 AM");
  });
});

test("public form page does not show the Edit Form header", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/forms/FRM00000004");
  await expect(page.getByLabel(/Child Full Name/i)).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Edit Form", { exact: true })).toHaveCount(0);
});
