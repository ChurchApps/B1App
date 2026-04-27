import type { Page, Locator } from "@playwright/test";

// MobileShell renders its own chrome (MobileAppBar + MobileDrawer) instead of
// the public-site Header, so [data-testid="user-menu-chip"] is not present.
// The most stable "logged in" indicator on mobile screens is the Logout
// button in MobileDrawer (only rendered when context.user is set).

export function mobileLogoutButton(page: Page): Locator {
  return page.locator('a[href="/mobile/logout"]').first();
}

export function mobileProfileButton(page: Page): Locator {
  return page.locator('button[aria-label="Profile"]').first();
}
