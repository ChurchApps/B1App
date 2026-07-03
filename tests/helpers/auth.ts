import type { Page } from "@playwright/test";

/** Race cached auth state vs login form; church determined by subdomain (no dialog). */
export async function login(page: Page) {
  await page.goto("/");

  const emailInput = page.locator('input[type="email"]');
  const userMenu = page.locator('[data-testid="user-menu-chip"]');

  const winner = await Promise.race([
    userMenu.waitFor({ state: "visible", timeout: 15000 }).then(() => "authenticated" as const).catch(() => null),
    emailInput.waitFor({ state: "visible", timeout: 15000 }).then(() => "login" as const).catch(() => null)
  ]);

  if (winner === "authenticated") return;
  if (winner === null) throw new Error("Neither login form nor authenticated header appeared within 15s");

  await emailInput.fill("demo@b1.church");
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
  await userMenu.waitFor({ state: "visible", timeout: 30000 });
}

export async function logout(page: Page) {
  const userMenu = page.locator('[data-testid="user-menu-chip"]');
  await userMenu.waitFor({ state: "visible", timeout: 10000 });
  await userMenu.click();
  const logoutItem = page.locator('[data-testid="logout-menu-item"], [data-testid="logout-list-item"]').first();
  await logoutItem.waitFor({ state: "visible", timeout: 5000 });
  await logoutItem.click();
  await page.locator('[data-testid="login-chip"]').waitFor({ state: "visible", timeout: 10000 });
}
