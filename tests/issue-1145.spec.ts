import { test, expect } from "@playwright/test";

// Issue #1145: the standalone form page ignored the form's custom Thank You Message.
test("standalone form shows the form's custom thank-you message after submit", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/forms/FRM00000004");

  const input = page.getByLabel(/Child Full Name/i);
  await expect(input).toBeVisible({ timeout: 15000 });
  await input.fill("Test Kid");
  await page.getByLabel(/Emergency Contact Phone/i).fill("555-1234");
  await page.locator("#formSubmissionBox").getByRole("button", { name: /submit|save/i }).click();

  await expect(page.getByText("Your child is registered for Vacation Bible School! See you there.")).toBeVisible({ timeout: 15000 });
});
