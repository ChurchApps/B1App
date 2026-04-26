import { test as base, type Page } from "@playwright/test";
import { login } from "./auth";
import { gotoMobile, gotoPublic, type MobileScreen, type PublicRoute } from "./navigation";

// Pre-extended `test` objects for each section. Specs import the variant they
// need and skip per-test login + navigation boilerplate. Test signatures
// remain `async ({ page }) => { ... }`.
//
// Usage:
//   import { mobileTest as test, expect } from './helpers/test-fixtures';
//   test('plans page renders', async ({ page }) => { ... });
//
// publicTest    — anonymous, no login. Use for public-site assertions.
// loggedInTest  — logged in via storage state, no navigation.
// mobileTest(screen) — logged in + navigated to /mobile/<screen>.
// publicAt(route)    — anonymous + navigated to /<route>.

export const publicTest = base.extend({
  page: async ({ page }, use) => {
    // Storage state is logged in by default; clear cookies + localStorage so
    // public specs see the anonymous shell.
    await page.context().clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      try { localStorage.clear(); } catch { /* ignore */ }
      try { sessionStorage.clear(); } catch { /* ignore */ }
    });
    await use(page);
  },
});

export const loggedInTest = base.extend({
  page: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

const navTest = (setup: (p: Page) => Promise<void>) =>
  base.extend({
    page: async ({ page }, use) => {
      await login(page);
      await setup(page);
      await use(page);
    },
  });

export const mobileTest = (screen: MobileScreen) =>
  navTest((p) => gotoMobile(p, screen));

export const publicAt = (route: PublicRoute) =>
  publicTest.extend({
    page: async ({ page }, use) => {
      await gotoPublic(page, route);
      await use(page);
    },
  });

export { expect } from "@playwright/test";
