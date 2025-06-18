import { test as base, Page } from '@playwright/test';

// Common selectors
export const selectors = {
  login: {
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    submitButton: 'button[type="submit"]',
    errorMessages: ['text=Invalid', 'text=Error', 'text=Incorrect', '.alert', '[role="alert"]']
  },
  navigation: {
    userMenu: '[id*="user"], .MuiChip-root',
    header: 'header, nav, [role="navigation"], .MuiAppBar-root',
    mobileMenu: '[aria-label*="menu"], button:has(svg), .MuiIconButton-root',
    drawer: '.MuiDrawer-root, [role="presentation"], aside'
  },
  memberPortal: {
    tabs: ['Timeline', 'Directory', 'Donations', 'Groups', 'Plans', 'Lessons'],
    menuItems: ['Member Portal', 'Edit profile', 'Logout']
  }
};

// Test fixture with common functionality
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  // Provide an authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Clear all cookies and storage before starting
    await page.context().clearCookies();
    
    // Login with shorter timeout
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill(selectors.login.emailInput, 'demo@chums.org');
    await page.fill(selectors.login.passwordInput, 'password');
    await page.click(selectors.login.submitButton);
    
    // Wait for redirect to member portal
    await page.waitForURL('**/my/**', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    
    // Use the authenticated page
    await use(page);
    
    // Cleanup after test
    await page.context().clearCookies();
  },
});

// Common helper functions
export class TestHelpers {
  static async waitForElement(page: Page, selector: string, timeout = 5000) {
    try {
      await page.waitForSelector(selector, { timeout, state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  static async clickIfVisible(page: Page, selector: string) {
    const element = page.locator(selector).first();
    if (await element.isVisible().catch(() => false)) {
      await element.click();
      return true;
    }
    return false;
  }

  static async findVisibleElement(page: Page, selectors: string[]) {
    for (const selector of selectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        return { selector, element };
      }
    }
    return null;
  }

  static async hasAnyText(page: Page, texts: string[]) {
    const pageContent = await page.locator('body').textContent();
    return texts.some(text => pageContent?.includes(text));
  }

  static async clearBrowserState(page: Page) {
    await page.context().clearCookies();
    await page.context().clearPermissions();
    // Only clear storage if we're on a page that allows it
    try {
      await page.evaluate(() => {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      });
    } catch {
      // Ignore errors from cross-origin pages
    }
  }

  static async quickLogin(page: Page) {
    await page.goto('/login');
    await page.fill(selectors.login.emailInput, 'demo@chums.org');
    await page.fill(selectors.login.passwordInput, 'password');
    await page.click(selectors.login.submitButton);
    await page.waitForURL('**/my/**', { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
  }

  static async isLoggedIn(page: Page) {
    // Quick check if we're on a member page
    return page.url().includes('/my/');
  }

  static async logout(page: Page) {
    // Direct logout via URL is fastest
    await page.goto('/logout');
    await page.waitForLoadState('networkidle');
  }
}

export { expect } from '@playwright/test';