import { Page, expect } from '@playwright/test';

export class AuthHelper {
  /**
   * Basic login - fills form and submits
   */
  static async login(page: Page, email = 'demo@chums.org', password = 'password') {
    // Navigate to the login page
    await page.goto('/login');
    
    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Fill in login credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    
    console.log('Login form submitted successfully');
    return true;
  }

  /**
   * Complete login flow and navigate to member portal
   */
  static async loginAndGoToMember(page: Page, email = 'demo@chums.org', password = 'password') {
    await this.login(page, email, password);
    
    // Login automatically redirects to /my/timeline, so we're already in the member portal
    // Just ensure we're on a member page
    const currentUrl = page.url();
    if (!currentUrl.includes('/my')) {
      await page.goto('/my');
      await page.waitForLoadState('networkidle');
    }
    
    console.log('Successfully logged in and in member portal');
    return true;
  }

  /**
   * Check if user is currently logged in by looking for authenticated content
   */
  static async isLoggedIn(page: Page) {
    const loggedInIndicators = [
      '.MuiAvatar-root',
      '[data-testid="user-menu"]',
      'text=My Profile',
      'text=Logout',
      // B1 specific indicators
      'text=Timeline',
      'text=Directory',
      'text=My Groups'
    ];
    
    for (const selector of loggedInIndicators) {
      const isVisible = await page.locator(selector).first().isVisible().catch(() => false);
      if (isVisible) {
        console.log(`Found login indicator: ${selector}`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Navigate to the home page
   */
  static async goToHome(page: Page) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to the member portal
   */
  static async goToMember(page: Page) {
    await page.goto('/my');
    await page.waitForLoadState('networkidle');
  }

  /**
   * Logout if currently logged in
   */
  static async logout(page: Page) {
    // Look for logout link/button
    const logoutSelectors = [
      'text=Logout',
      'text=Sign Out',
      '[href*="logout"]',
      'button:has-text("Logout")',
      'a:has-text("Logout")'
    ];
    
    for (const selector of logoutSelectors) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        await element.click();
        await page.waitForLoadState('networkidle');
        console.log('Logout completed');
        return true;
      }
    }
    
    // If no logout button found, navigate to logout URL
    await page.goto('/logout');
    await page.waitForLoadState('networkidle');
    console.log('Logout via URL navigation');
    return true;
  }
}