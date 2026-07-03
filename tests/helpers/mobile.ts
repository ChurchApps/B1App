import type { Page, Locator } from "@playwright/test";

// MobileShell chrome has no user-menu-chip; use Logout button from MobileDrawer.

export function mobileLogoutButton(page: Page): Locator {
  return page.locator('a[href="/mobile/logout"]').first();
}

export function mobileProfileButton(page: Page): Locator {
  return page.locator('button[aria-label="Profile"]').first();
}
