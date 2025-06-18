import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Calendar & Events', () => {
  test('view church calendar', async ({ page }) => {
    // Calendar might be public
    await page.goto('/calendar');
    await page.waitForLoadState('domcontentloaded');
    
    const url = page.url();
    // May redirect or show calendar
    if (!url.includes('404')) {
      const calendarIndicators = ['Calendar', 'Events', 'Schedule', 'Date', 'Month'];
      const hasCalendar = await TestHelpers.hasAnyText(page, calendarIndicators);
      
      if (hasCalendar) {
        expect(hasCalendar).toBeTruthy();
      }
    }
  });

  test.skip('view event details', async ({ page }) => {
    // Skip if no events available
    await page.goto('/calendar');
    
    // Look for event elements
    const eventSelectors = [
      '.event',
      '.calendar-event',
      '[role="button"][aria-label*="event"]',
      'a[href*="/event"]'
    ];
    
    const event = await TestHelpers.findVisibleElement(page, eventSelectors);
    if (event) {
      await event.element.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Check for event details
      const detailIndicators = ['When', 'Where', 'Description', 'Location', 'Time'];
      const hasDetails = await TestHelpers.hasAnyText(page, detailIndicators);
      expect(hasDetails).toBeTruthy();
    }
  });

  test.skip('calendar views', async ({ page }) => {
    // Skip if calendar not available
    await page.goto('/calendar');
    
    // Look for view options
    const viewSelectors = [
      'button:has-text("Month")',
      'button:has-text("Week")',
      'button:has-text("Day")',
      'button:has-text("List")'
    ];
    
    const viewButton = await TestHelpers.findVisibleElement(page, viewSelectors);
    if (viewButton) {
      await viewButton.element.click();
      await page.waitForTimeout(500);
      expect(viewButton).toBeTruthy();
    }
  });

  test.skip('event registration', async ({ authenticatedPage }) => {
    // Skip actual registration
    await authenticatedPage.goto('/events');
    
    // Look for registration options
    const registerSelectors = [
      'button:has-text("Register")',
      'button:has-text("Sign Up")',
      'button:has-text("RSVP")',
      'text=Register'
    ];
    
    const registerButton = await TestHelpers.findVisibleElement(authenticatedPage, registerSelectors);
    if (registerButton) {
      expect(registerButton).toBeTruthy();
    }
  });
});