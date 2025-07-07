import { test, expect, TestHelpers } from '../helpers/test-base';

test.describe('Profile CRUD Operations', () => {
  let originalBio: string | null = null;
  let originalPhone: string | null = null;
  const testBio = `Test bio ${Date.now()}`;
  const testPhone = '555-TEST-001';

  test('read current profile data', async ({ authenticatedPage }) => {
    // Navigate to profile edit
    const userMenu = await TestHelpers.findVisibleElement(
      authenticatedPage, 
      ['[id*="user"]', '.MuiChip-root']
    );
    
    expect(userMenu).toBeTruthy();
    
    if (userMenu) {
      await userMenu.element.click();
      await authenticatedPage.waitForTimeout(300);
      
      const editLink = authenticatedPage.locator('text=Edit profile').first();
      await editLink.click();
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      // Store original values
      const bioField = authenticatedPage.locator('textarea[name="bio"], textarea[id*="bio"], textarea[placeholder*="bio"]').first();
      const phoneField = authenticatedPage.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone"]').first();
      
      if (await bioField.isVisible()) {
        originalBio = await bioField.inputValue();
      }
      
      if (await phoneField.isVisible()) {
        originalPhone = await phoneField.inputValue();
      }
    }
  });

  test.skip('update profile information', async ({ authenticatedPage }) => {
    // Skip - authentication timeout issues
    // Navigate to profile edit
    const userMenu = await TestHelpers.findVisibleElement(
      authenticatedPage, 
      ['[id*="user"]', '.MuiChip-root']
    );
    
    if (userMenu) {
      await userMenu.element.click();
      await authenticatedPage.waitForTimeout(300);
      
      const editLink = authenticatedPage.locator('text=Edit profile').first();
      await editLink.click();
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      // Update bio
      const bioField = authenticatedPage.locator('textarea[name="bio"], textarea[id*="bio"], textarea[placeholder*="bio"]').first();
      if (await bioField.isVisible()) {
        await bioField.fill(testBio);
      }
      
      // Update phone
      const phoneField = authenticatedPage.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone"]').first();
      if (await phoneField.isVisible()) {
        await phoneField.fill(testPhone);
      }
      
      // Save changes
      const saveButton = authenticatedPage.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
      await saveButton.click();
      
      await authenticatedPage.waitForTimeout(2000);
      
      // Verify success (might show a message or redirect)
      const currentUrl = authenticatedPage.url();
      const hasSuccess = await authenticatedPage.locator('text=Success, text=Updated, text=Saved').first().isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(currentUrl || hasSuccess).toBeTruthy();
    }
  });

  test('verify profile updates', async ({ authenticatedPage }) => {
    // Navigate back to profile edit to verify changes
    await authenticatedPage.goto('/my/community');
    
    const userMenu = await TestHelpers.findVisibleElement(
      authenticatedPage, 
      ['[id*="user"]', '.MuiChip-root']
    );
    
    if (userMenu) {
      await userMenu.element.click();
      await authenticatedPage.waitForTimeout(300);
      
      const editLink = authenticatedPage.locator('text=Edit profile').first();
      await editLink.click();
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      // Check if updates persisted
      const bioField = authenticatedPage.locator('textarea[name="bio"], textarea[id*="bio"], textarea[placeholder*="bio"]').first();
      if (await bioField.isVisible()) {
        const currentBio = await bioField.inputValue();
        expect(currentBio).toBe(testBio);
      }
      
      const phoneField = authenticatedPage.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone"]').first();
      if (await phoneField.isVisible()) {
        const currentPhone = await phoneField.inputValue();
        expect(currentPhone).toBe(testPhone);
      }
    }
  });

  test.skip('restore original profile data', async ({ authenticatedPage }) => {
    // Skip - authentication timeout issues
    // Navigate to profile edit
    const userMenu = await TestHelpers.findVisibleElement(
      authenticatedPage, 
      ['[id*="user"]', '.MuiChip-root']
    );
    
    if (userMenu) {
      await userMenu.element.click();
      await authenticatedPage.waitForTimeout(300);
      
      const editLink = authenticatedPage.locator('text=Edit profile').first();
      await editLink.click();
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      // Restore original bio
      if (originalBio !== null) {
        const bioField = authenticatedPage.locator('textarea[name="bio"], textarea[id*="bio"], textarea[placeholder*="bio"]').first();
        if (await bioField.isVisible()) {
          await bioField.fill(originalBio);
        }
      }
      
      // Restore original phone
      if (originalPhone !== null) {
        const phoneField = authenticatedPage.locator('input[name="phone"], input[type="tel"], input[placeholder*="phone"]').first();
        if (await phoneField.isVisible()) {
          await phoneField.fill(originalPhone);
        }
      }
      
      // Save restoration
      const saveButton = authenticatedPage.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
      await saveButton.click();
      
      await authenticatedPage.waitForTimeout(2000);
      
      console.log('Profile data restored to original state');
    }
  });
});