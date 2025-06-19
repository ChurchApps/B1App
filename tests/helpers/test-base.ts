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

  /**
   * Comprehensive login helper with browser state clearing and church selection
   * This is the most robust login method that handles all edge cases
   */
  static async loginAndSelectChurch(page: Page, returnUrl?: string): Promise<void> {
    console.log(`=== Starting login process ${returnUrl ? 'with returnUrl: ' + returnUrl : ''} ===`);
    
    // Clear all browser state first
    await page.context().clearCookies();
    await page.context().clearPermissions();
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch {
      // Ignore if we can't clear storage on current page
    }
    
    // Navigate to login with optional return URL
    const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
    console.log('Navigating to login URL:', loginUrl);
    await page.goto(loginUrl);
    
    // Fill login form
    await page.fill(selectors.login.emailInput, 'demo@chums.org');
    await page.fill(selectors.login.passwordInput, 'password');
    await page.click(selectors.login.submitButton);
    
    // Wait for page to settle after login
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    // Handle church selection if it appears
    const hasDialog = await page.locator('[role="dialog"], .MuiDialog-root').isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasDialog) {
      console.log('Church selection modal detected');
      
      // Try to find Grace Community Church first
      let churchSelected = false;
      
      const graceSelectors = [
        '[role="dialog"] a:has-text("Grace Community Church")',
        '.MuiDialog-root a:has-text("Grace Community Church")',
        'text="Grace Community Church"',
        'a:has-text("Grace Community Church")',
      ];
      
      for (const selector of graceSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`Found Grace Community Church with selector: ${selector}`);
            await element.click();
            churchSelected = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!churchSelected) {
        console.log('Grace Community Church not found, selecting first available church...');
        const firstChurch = page.locator('[role="dialog"] a, .MuiDialog-root a').first();
        if (await firstChurch.isVisible({ timeout: 2000 })) {
          const churchName = await firstChurch.textContent();
          console.log(`Selecting fallback church: ${churchName?.trim()}`);
          await firstChurch.click();
          churchSelected = true;
        }
      }
      
      if (churchSelected) {
        await page.waitForTimeout(3000);
        console.log('Church selected successfully');
      } else {
        throw new Error('Could not select any church from the modal');
      }
    } else {
      console.log('No church selection modal - proceeding directly');
    }
    
    // Wait for final navigation to complete
    try {
      if (returnUrl && returnUrl.startsWith('/my/')) {
        await page.waitForURL(`**${returnUrl}`, { timeout: 15000 });
      } else {
        await page.waitForURL('**/my/**', { timeout: 15000 });
      }
    } catch (error) {
      console.log('URL wait timeout - current URL:', page.url());
      // Don't throw error here, let the test continue and fail appropriately
    }
    
    await page.waitForLoadState('domcontentloaded');
    console.log('Login completed, final URL:', page.url());
  }
}

export { expect } from '@playwright/test';