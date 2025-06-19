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
}

export { expect } from '@playwright/test';