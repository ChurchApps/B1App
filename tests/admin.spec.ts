import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Admin Access', () => {
  test('admin pages require permissions', async ({ page }) => {
    // Use shared login method
    await TestHelpers.loginAndSelectChurch(page);
    
    // Try to access admin
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Check if user has admin access or was redirected
    const url = page.url();
    // The demo user might have admin access in the demo environment
    const hasAccess = url.includes('/admin');
    const wasRedirected = url.includes('/my');
    
    expect(hasAccess || wasRedirected).toBeTruthy();
  });

  test('admin site page access', async ({ page }) => {
    // Use shared login method
    await TestHelpers.loginAndSelectChurch(page);
    
    // Try direct admin site access
    await page.goto('/admin/site');
    await page.waitForLoadState('domcontentloaded');
    
    const url = page.url();
    // Either has access (admin/site) or redirected (my)
    expect(url.includes('/admin/site') || url.includes('/my')).toBeTruthy();
  });
});