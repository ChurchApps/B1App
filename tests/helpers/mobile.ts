import type { Page, Locator } from "@playwright/test";

// The shell renders the Profile avatar (phone app bar or desktop header) only for a signed-in user.
export function mobileSignedInChrome(page: Page): Locator {
  return page.getByRole("button", { name: "Profile", exact: true }).filter({ visible: true }).first();
}

// Specs written against the old drawer used its Logout button as the signed-in signal; Sign out now lives on /mobile/more.
export const mobileLogoutButton = mobileSignedInChrome;

export function mobileSignOutLink(page: Page): Locator {
  return page.locator('a[href="/mobile/logout"]').first();
}
