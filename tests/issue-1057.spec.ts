import { test, expect } from "@playwright/test";

// Issue #1057: fonts chosen under Appearance never reach the page.
// Demo data sets Grace's globalStyles.fonts to {"heading": "Poppins", "body": "Inter"}.

const fontOf = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((el) => getComputedStyle(el).fontFamily);

test("site fonts from Appearance apply to page content", async ({ page }) => {
  await page.goto("/");

  const heading = page.getByRole("heading", { name: /Welcome Home to Grace Community Church/i }).first();
  await expect(heading).toBeVisible();
  expect(await fontOf(heading)).toContain("Poppins");

  const paragraph = page.getByText(/Join us this Sunday/i).first();
  await expect(paragraph).toBeVisible();
  expect(await fontOf(paragraph)).toContain("Inter");
});
