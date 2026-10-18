import { test, expect } from "@playwright/test";

// Issue #1281: when the church's app Home has no links yet, signed-out visitors saw only
// the "getting set up" card and no sign-in prompt.

test.use({ storageState: { cookies: [], origins: [] } });

test("signed-out Home with no links still shows the sign-in prompt", async ({ page }) => {
  await page.route(/\/links\/church\/[^/]+\?category=b1Tab/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.goto("/mobile/dashboard");

  const main = page.locator("main");
  await expect(main.getByText("We're just getting set up.", { exact: false })).toBeVisible({ timeout: 20000 });
  await expect(main.getByText("Sign in to see your groups, giving, and more.")).toBeVisible();
  await expect(main.getByRole("link", { name: "Sign In" })).toBeVisible();
});
