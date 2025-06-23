import { test, expect, selectors, TestHelpers } from './helpers/test-base';

test.describe('Navigation', () => {
  test('public pages accessible', async ({ page }) => {
    // Home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toBeTruthy();
    
    // Login page
    await page.goto('/login');
    expect(page.url()).toContain('/login');
  });

  test('header navigation exists', async ({ page }) => {
    await page.goto('/');
    const header = await TestHelpers.findVisibleElement(page, selectors.navigation.header.split(', '));
    expect(header).toBeTruthy();
  });

  test('mobile menu responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Find mobile menu button
    const mobileMenu = await TestHelpers.findVisibleElement(page, selectors.navigation.mobileMenu.split(', '));
    expect(mobileMenu).toBeTruthy();
    
    // Click menu if found
    if (mobileMenu) {
      await mobileMenu.element.click();
      await page.waitForTimeout(300); // Animation
      
      // Check drawer opened
      const drawer = await TestHelpers.findVisibleElement(page, selectors.navigation.drawer.split(', '));
      expect(drawer).toBeTruthy();
    }
  });

  test('member portal navigation', async ({ authenticatedPage }) => {
    // Check we're in member portal
    expect(authenticatedPage.url()).toContain('/my');
    
    // Verify some navigation tabs exist
    const hasNavTabs = await TestHelpers.hasAnyText(authenticatedPage, selectors.memberPortal.tabs);
    expect(hasNavTabs).toBeTruthy();
    
    // Try navigating to different section
    if (await TestHelpers.clickIfVisible(authenticatedPage, 'text=Directory')) {
      await authenticatedPage.waitForLoadState('domcontentloaded');
      expect(authenticatedPage.url()).toContain('/my/community');
    }
  });

  test('user menu functionality', async ({ authenticatedPage }) => {
    // Find and click user menu
    const userMenu = await TestHelpers.findVisibleElement(authenticatedPage, selectors.navigation.userMenu.split(', '));
    expect(userMenu).toBeTruthy();
    
    if (userMenu) {
      await userMenu.element.click();
      await authenticatedPage.waitForTimeout(300);
      
      // Check menu items
      const hasMenuItems = await TestHelpers.hasAnyText(authenticatedPage, selectors.memberPortal.menuItems);
      expect(hasMenuItems).toBeTruthy();
    }
  });
});