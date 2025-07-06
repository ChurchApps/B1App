import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers/test-base';

test.describe('Home Page', () => {
  test('should display home page content and test calendar functionality if present', async ({ page }) => {
    await TestHelpers.clearBrowserState(page);
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we're on the home page
    expect(page.url()).toMatch(/\/$|\/home$/);
    
    // Verify basic home page elements
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=Grace Community Church').first()).toBeVisible();
    
    // Look for calendar component on home page
    const homePageCalendar = page.locator('.fc-view, .rbc-calendar, [class*="calendar"], [data-testid="calendar"]').first();
    
    if (await homePageCalendar.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Found calendar on home page');
      await testCalendarFunctionality(page, homePageCalendar);
    } else {
      console.log('No calendar found on home page');
      
      // Test the service times section instead (which we know exists)
      const serviceTimes = page.locator('text=Sunday Service Times, text=Morning Worship, text=Evening Service').first();
      await expect(serviceTimes).toBeVisible();
      
      // Test basic navigation
      const loginButton = page.locator('text=Login, [href*="login"]').first();
      if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginButton.click();
        await page.waitForLoadState('domcontentloaded');
        expect(page.url()).toContain('login');
        
        // Go back to home
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
      }
    }
    
    // Verify page scrolling works
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.locator('h1').first()).toBeVisible();
  });
  
  // Example test for when calendar is present (template for future use)
  test.skip('should interact with curated calendar events (template)', async ({ page }) => {
    await TestHelpers.clearBrowserState(page);
    
    // Navigate to page with calendar
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Find calendar
    const calendar = page.locator('.fc-view, .rbc-calendar').first();
    await expect(calendar).toBeVisible();
    
    // Find and click an event
    const calendarEvents = page.locator('.fc-event, .rbc-event').filter({ hasText: /.+/ });
    await expect(calendarEvents.first()).toBeVisible();
    await calendarEvents.first().click();
    
    // Verify event modal opens
    const eventModal = page.locator('[role="dialog"], .MuiDialog-root').first();
    await expect(eventModal).toBeVisible();
    
    // Close modal with escape key
    await page.keyboard.press('Escape');
    await expect(eventModal).not.toBeVisible();
  });
});

async function testCalendarFunctionality(page: any, calendar: any) {
  console.log('Testing calendar functionality...');
  
  // Look for calendar events
  const calendarEvents = calendar.locator('.fc-event, .rbc-event, [class*="event"]').filter({ hasText: /.+/ });
  const eventCount = await calendarEvents.count();
  
  if (eventCount > 0) {
    console.log(`Found ${eventCount} calendar events`);
    
    // Click on first event
    await calendarEvents.first().click();
    
    // Look for event modal
    const eventModal = page.locator('[role="dialog"], .MuiDialog-root').first();
    if (await eventModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Event modal opened successfully');
      
      // Close modal
      await page.keyboard.press('Escape');
      await expect(eventModal).not.toBeVisible({ timeout: 3000 });
      console.log('Event modal closed successfully');
    }
  } else {
    console.log('Calendar present but no events found');
    await expect(calendar).toBeVisible();
  }
}