import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-base';

test.describe('Authentication', () => {
  test('should login with returnUrl and redirect to /admin page', async ({ page }) => {
    // 1. Clear cache and go to login with /admin returnUrl
    await TestHelpers.clearBrowserState(page);
    await page.goto('/login?returnUrl=%2Fadmin');
    
    // 2. Verify we're on login page with returnUrl
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('returnUrl');
    expect(page.url()).toContain('admin');
    
    // 3. Login and select church using helper
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
    await page.waitForURL('**/admin', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    
    // 4. Verify on /admin page
    expect(page.url()).toContain('/admin');
  });

  test('should successfully login and navigate to member portal', async ({ page }) => {
    await TestHelpers.clearBrowserState(page);
    
    await TestHelpers.login(page);
    
    expect(page.url()).toContain('/my/');
  });

  test('should redirect to specific page after login with returnUrl', async ({ page }) => {
    await TestHelpers.clearBrowserState(page);
    
    await TestHelpers.login(page, '/my/timeline');
    
    expect(page.url()).toContain('/my/timeline');
  });
});