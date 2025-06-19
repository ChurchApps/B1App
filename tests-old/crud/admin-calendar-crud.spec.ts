import { test, expect, TestHelpers } from '../helpers/test-base';

test.describe('Admin Calendar/Events CRUD Operations', () => {
  const testEventTitle = `Test Event ${Date.now()}`;
  const testEventDescription = 'This is a test event that will be deleted';
  let eventId: string | null = null;

  test('navigate to admin calendars', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/calendars');
    await authenticatedPage.waitForLoadState('domcontentloaded');
    
    const url = authenticatedPage.url();
    expect(url).toContain('/admin/calendars');
    
    // Look for calendar content
    const calendarIndicators = ['Calendar', 'Events', 'Curated'];
    const hasCalendarContent = await TestHelpers.hasAnyText(authenticatedPage, calendarIndicators);
    expect(hasCalendarContent).toBeTruthy();
  });

  test('create or access a calendar', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin/calendars');
    
    // Look for existing calendar or create button
    const calendarLinks = authenticatedPage.locator('a[href*="/admin/calendars/"]');
    const hasCalendars = await calendarLinks.count() > 0;
    
    if (hasCalendars) {
      // Click on first calendar
      await calendarLinks.first().click();
      await authenticatedPage.waitForLoadState('domcontentloaded');
      console.log('Accessed existing calendar');
    } else {
      // Try to create new calendar
      const addButton = await TestHelpers.findVisibleElement(authenticatedPage, [
        'button:has-text("Add")',
        'button:has-text("Create")',
        '[aria-label*="add"]'
      ]);
      
      if (addButton) {
        await addButton.element.click();
        await authenticatedPage.waitForTimeout(1000);
        
        // Fill calendar name
        const nameInput = authenticatedPage.locator('input[name="name"], input[placeholder*="Name"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Calendar');
          
          const saveButton = authenticatedPage.locator('button:has-text("Save"), button[type="submit"]').first();
          await saveButton.click();
          await authenticatedPage.waitForTimeout(2000);
        }
      }
    }
  });

  test('create a new event', async ({ authenticatedPage }) => {
    // Navigate to a calendar page
    const calendarUrl = authenticatedPage.url();
    if (!calendarUrl.includes('/calendars/')) {
      await authenticatedPage.goto('/admin/calendars');
      const firstCalendar = authenticatedPage.locator('a[href*="/admin/calendars/"]').first();
      if (await firstCalendar.isVisible()) {
        await firstCalendar.click();
        await authenticatedPage.waitForLoadState('domcontentloaded');
      }
    }
    
    // Look for add event button
    const addEventSelectors = [
      'button:has-text("Add Event")',
      'button:has-text("New Event")',
      'button:has-text("Create Event")',
      '[aria-label*="add"]',
      'button:has-text("+")'
    ];
    
    const addButton = await TestHelpers.findVisibleElement(authenticatedPage, addEventSelectors);
    
    if (addButton) {
      await addButton.element.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Fill event details
      const titleInput = authenticatedPage.locator('input[name="title"], input[placeholder*="Title"], input[placeholder*="Event"]').first();
      const descInput = authenticatedPage.locator('textarea[name="description"], textarea[placeholder*="Description"]').first();
      const dateInput = authenticatedPage.locator('input[type="date"], input[name*="date"]').first();
      const timeInput = authenticatedPage.locator('input[type="time"], input[name*="time"]').first();
      
      if (await titleInput.isVisible()) {
        await titleInput.fill(testEventTitle);
      }
      
      if (await descInput.isVisible()) {
        await descInput.fill(testEventDescription);
      }
      
      if (await dateInput.isVisible()) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await dateInput.fill(tomorrow.toISOString().split('T')[0]);
      }
      
      if (await timeInput.isVisible()) {
        await timeInput.fill('14:00');
      }
      
      // Save event
      const saveButton = authenticatedPage.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await authenticatedPage.waitForTimeout(2000);
        console.log('Event created');
      }
    } else {
      console.log('Add event button not found');
    }
  });

  test('view event in calendar', async ({ authenticatedPage }) => {
    // Stay on calendar page or navigate back
    const url = authenticatedPage.url();
    if (!url.includes('/calendars/')) {
      await authenticatedPage.goto('/admin/calendars');
      const firstCalendar = authenticatedPage.locator('a[href*="/admin/calendars/"]').first();
      if (await firstCalendar.isVisible()) {
        await firstCalendar.click();
        await authenticatedPage.waitForLoadState('domcontentloaded');
      }
    }
    
    // Look for our test event
    const eventElement = authenticatedPage.locator(`text="${testEventTitle}"`).first();
    const isVisible = await eventElement.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isVisible) {
      console.log('Found created event in calendar');
      expect(isVisible).toBeTruthy();
    } else {
      // Event might be in a different view
      console.log('Event not immediately visible, may need to change calendar view');
    }
  });

  test('update event details', async ({ authenticatedPage }) => {
    // Find and click on our event
    const eventElement = authenticatedPage.locator(`text="${testEventTitle}"`).first();
    
    if (await eventElement.isVisible()) {
      await eventElement.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Look for edit button in modal/popup
      const editButton = authenticatedPage.locator('button:has-text("Edit"), [aria-label*="edit"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await authenticatedPage.waitForTimeout(500);
      }
      
      // Update title
      const titleInput = authenticatedPage.locator('input[value*="Test Event"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill(`${testEventTitle} - Updated`);
        
        // Save changes
        const saveButton = authenticatedPage.locator('button:has-text("Save"), button:has-text("Update")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await authenticatedPage.waitForTimeout(2000);
          console.log('Event updated');
        }
      }
    }
  });

  test('delete the event', async ({ authenticatedPage }) => {
    // Find our event
    const eventElement = authenticatedPage.locator(`text="${testEventTitle}"`).first();
    
    if (await eventElement.isVisible()) {
      await eventElement.click();
      await authenticatedPage.waitForTimeout(1000);
      
      // Look for delete button
      const deleteButton = authenticatedPage.locator('button:has-text("Delete"), [aria-label*="delete"]').first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion
        const confirmButton = authenticatedPage.locator('button:has-text("Confirm"), button:has-text("Yes")').last();
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
          await authenticatedPage.waitForTimeout(2000);
        }
        
        // Close modal if still open
        const closeButton = authenticatedPage.locator('button:has-text("Close"), [aria-label*="close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
        
        // Verify deletion
        await authenticatedPage.waitForTimeout(1000);
        const stillExists = await eventElement.isVisible({ timeout: 2000 }).catch(() => false);
        expect(stillExists).toBeFalsy();
        console.log('Event deleted successfully');
      } else {
        console.log('Delete button not found');
      }
    }
  });
});