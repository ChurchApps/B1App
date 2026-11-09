import { test as setup, expect } from "@playwright/test";
import { SMOKE_STATE } from "./env";

// The church comes from the subdomain, so there is no church picker after login.
setup("log in with the smoke account", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', process.env.SMOKE_EMAIL!);
  await page.fill('input[type="password"]', process.env.SMOKE_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });

  // The Profile avatar only renders for a signed-in user.
  await page.goto("/mobile/dashboard");
  await expect(page.getByRole("button", { name: "Profile", exact: true }).filter({ visible: true }).first()).toBeVisible({ timeout: 30000 });
  await page.context().storageState({ path: SMOKE_STATE });
});
