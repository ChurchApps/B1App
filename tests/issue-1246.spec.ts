import { test, expect } from "@playwright/test";

// #1246: an accepted volunteer on a position without self-signup had no way to back out from the plan page.
test("accepted assignment can be declined from the plan page", async ({ page }) => {
  await page.goto("/mobile/plans/PLA00000001");
  await page.getByRole("tab", { name: "Overview" }).click();
  const card = page.locator("div")
    .filter({ has: page.getByText("Sound Tech", { exact: true }) })
    .filter({ has: page.getByText("Service Times", { exact: true }) })
    .filter({ hasNot: page.getByText("Projection Tech", { exact: true }) })
    .last();
  await expect(card.getByText("Accepted", { exact: true })).toBeVisible({ timeout: 30000 });

  await card.getByRole("button", { name: "Decline" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Decline" }).click();
  await expect(card.getByText("Declined", { exact: true })).toBeVisible({ timeout: 15000 });
});
