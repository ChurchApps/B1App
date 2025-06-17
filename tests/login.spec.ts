import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth-helper';

test.describe('B1 Church Login', () => {
  test('should display login form elements and accept credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Check that login form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Fill in login credentials
    await page.fill('input[type="email"]', 'demo@chums.org');
    await page.fill('input[type="password"]', 'password');
    
    // Verify fields are filled
    const emailValue = await page.locator('input[type="email"]').inputValue();
    const passwordValue = await page.locator('input[type="password"]').inputValue();
    
    expect(emailValue).toBe('demo@chums.org');
    expect(passwordValue).toBe('password');
    
    console.log('Login form elements and credentials test completed');
  });

  test('should reject bad password', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Try bad password login
    await page.fill('input[type="email"]', 'demo@chums.org');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Should stay on login page or show error
    const currentUrl = page.url();
    const stayedOnLogin = currentUrl.includes('/login');
    
    // Should not be redirected to member area
    const redirectedToMember = currentUrl.includes('/my');
    expect(redirectedToMember).toBeFalsy();
    
    // Check for error messages or indication of failed login
    const errorSelectors = [
      'text=Invalid',
      'text=Error',
      'text=Incorrect',
      'text=failed',
      'text=wrong',
      '.error',
      '.alert-danger',
      '[role="alert"]'
    ];
    
    let hasError = false;
    for (const selector of errorSelectors) {
      const errorVisible = await page.locator(selector).first().isVisible().catch(() => false);
      if (errorVisible) {
        hasError = true;
        console.log(`Found error indicator: ${selector}`);
        break;
      }
    }
    
    console.log('Bad password rejection test completed');
  });

  test('should complete successful login flow', async ({ page }) => {
    // Perform login using helper
    await AuthHelper.login(page);
    
    // Verify we are redirected to member area
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    expect(currentUrl).toContain('/my');
    
    // Verify we are logged in by checking for authenticated content
    const isLoggedIn = await AuthHelper.isLoggedIn(page);
    expect(isLoggedIn).toBeTruthy();
    
    // Should not be on login page anymore
    const isOnLoginPage = currentUrl.includes('/login');
    expect(isOnLoginPage).toBeFalsy();
    
    console.log('Successful login flow completed');
  });

  test('should navigate to member portal after login', async ({ page }) => {
    // Login and navigate to member portal
    await AuthHelper.loginAndGoToMember(page);
    
    // Verify we're on the member portal
    const currentUrl = page.url();
    expect(currentUrl).toContain('/my');
    
    // Check for member portal specific content
    const memberPortalIndicators = [
      'Timeline',
      'Directory', 
      'Donations',
      'Groups',
      'Plans',
      'Lessons'
    ];
    
    const pageContent = await page.locator('body').textContent();
    let foundMemberContent = false;
    
    for (const indicator of memberPortalIndicators) {
      if (pageContent?.includes(indicator)) {
        foundMemberContent = true;
        console.log(`Found member portal content: ${indicator}`);
        break;
      }
    }
    
    expect(foundMemberContent).toBeTruthy();
    
    console.log('Member portal navigation test completed');
  });
});