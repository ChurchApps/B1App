import { test as base, type Page } from "@playwright/test";
import { login } from "./auth";
import { gotoMobile, gotoPublic, type MobileScreen, type PublicRoute } from "./navigation";

export const publicTest = base.extend({
  page: async ({ page }, use) => {
    // Storage state is logged in by default; clear for public tests.
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      try { localStorage.clear(); } catch { /* ignore */ }
      try { sessionStorage.clear(); } catch { /* ignore */ }
    });
    await use(page);
  }
});

export const loggedInTest = base.extend({
  page: async ({ page }, use) => {
    await login(page);
    await use(page);
  }
});

const navTest = (setup: (p: Page) => Promise<void>) =>
  base.extend({
    page: async ({ page }, use) => {
      await login(page);
      await setup(page);
      await use(page);
    }
  });

export const mobileTest = (screen: MobileScreen) =>
  navTest((p) => gotoMobile(p, screen));

export const publicAt = (route: PublicRoute) =>
  publicTest.extend({
    page: async ({ page }, use) => {
      await gotoPublic(page, route);
      await use(page);
    }
  });

export { expect } from "@playwright/test";
