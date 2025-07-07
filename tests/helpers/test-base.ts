import { Page } from '@playwright/test';

export class TestHelpers {
  static async clearBrowserState(page: Page) {
    await page.context().clearCookies();
    await page.context().clearPermissions();
    
    // Navigate to home to clear storage safely
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  static async login(page: Page, returnUrl?: string) {
    const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
    await page.goto(loginUrl);
    
    await page.fill('input[type="email"]', 'demo@chums.org');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Handle church selection modal if it appears
    const dialog = page.locator('[role="dialog"], .MuiDialog-root');
    if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      const firstChurch = dialog.locator('a').first();
      await firstChurch.click();
    }
    
    // Wait for navigation to complete
    if (returnUrl) {
      await page.waitForURL(`**${returnUrl}`, { timeout: 15000 });
    } else {
      await page.waitForURL('**/my/**', { timeout: 15000 });
    }
    await page.waitForLoadState('domcontentloaded');
  }

  static async navigateToAdminPortal(page: Page) {
    // Try direct navigation to admin portal to avoid UI interaction issues
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // If the above doesn't work, try the menu approach
    if (!page.url().includes('/admin')) {
      // Wait for the user menu to be available after login
      const userMenuChip = page.locator('[data-testid="user-menu-chip"]');
      await userMenuChip.waitFor({ state: 'visible', timeout: 10000 });
      
      // Force click using JavaScript to bypass viewport issues
      await userMenuChip.evaluate(element => element.click());
      
      const adminPortalItem = page.locator('[data-testid="admin-portal-menu-item"]');
      await adminPortalItem.waitFor({ state: 'visible', timeout: 5000 });
      await adminPortalItem.click();
    }
    
    await page.waitForURL('**/admin', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
  }

  static async navigateToMemberPortal(page: Page) {
    // Wait for the user menu to be available after login
    const userMenuChip = page.locator('[data-testid="user-menu-chip"]');
    await userMenuChip.waitFor({ state: 'visible', timeout: 10000 });
    await userMenuChip.click();
    
    const memberPortalItem = page.locator('[data-testid="member-portal-menu-item"]');
    await memberPortalItem.waitFor({ state: 'visible', timeout: 5000 });
    await memberPortalItem.click();
    
    await page.waitForURL('**/my/**', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
  }

  static async logout(page: Page) {
    const userMenuChip = page.locator('[data-testid="user-menu-chip"]');
    await userMenuChip.waitFor({ state: 'visible', timeout: 10000 });
    await userMenuChip.click();
    
    const logoutItem = page.locator('[data-testid="logout-menu-item"]');
    await logoutItem.waitFor({ state: 'visible', timeout: 5000 });
    await logoutItem.click();
    
    await page.waitForURL('**/login', { timeout: 15000 });
  }
}

export { expect } from '@playwright/test';