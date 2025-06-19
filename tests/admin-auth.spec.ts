import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-base';

test.describe('Authentication', () => {
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