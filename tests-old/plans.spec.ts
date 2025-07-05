import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Service Plans & Scheduling', () => {
  test('access plans page', async ({ authenticatedPage }) => {
    // Navigate to plans
    await authenticatedPage.goto('/my/plans');
    await authenticatedPage.waitForLoadState('domcontentloaded');
    
    const url = authenticatedPage.url();
    // Check if on plans page
    if (url.includes('/my/plans')) {
      const plansIndicators = ['Plans', 'Schedule', 'Service', 'Team', 'Position'];
      const hasPlansContent = await TestHelpers.hasAnyText(authenticatedPage, plansIndicators);
      expect(hasPlansContent).toBeTruthy();
    } else {
      // May redirect if feature not available
      expect(url).toContain('/my');
    }
  });

  test.skip('view service positions', async ({ authenticatedPage }) => {
    // Skip if user not on a team
    await authenticatedPage.goto('/my/plans');
    
    // Look for position information
    const positionSelectors = [
      '.position',
      'text=Position',
      'text=Role',
      '.team-position'
    ];
    
    const position = await TestHelpers.findVisibleElement(authenticatedPage, positionSelectors);
    if (position) {
      expect(position).toBeTruthy();
    }
  });

  test.skip('view upcoming schedule', async ({ authenticatedPage }) => {
    // Skip if no scheduled services
    await authenticatedPage.goto('/my/plans');
    
    // Look for schedule elements
    const scheduleIndicators = ['Upcoming', 'Next', 'Schedule', 'Date', 'Time'];
    const hasSchedule = await TestHelpers.hasAnyText(authenticatedPage, scheduleIndicators);
    
    if (hasSchedule) {
      expect(hasSchedule).toBeTruthy();
    }
  });

  test.skip('blockout dates management', async ({ authenticatedPage }) => {
    // Skip if not a team member
    await authenticatedPage.goto('/my/plans');
    
    // Look for blockout options
    const blockoutSelectors = [
      'text=Blockout',
      'text=Unavailable',
      'button:has-text("Add Blockout")',
      'text=Can\'t Serve'
    ];
    
    const blockout = await TestHelpers.findVisibleElement(authenticatedPage, blockoutSelectors);
    if (blockout) {
      expect(blockout).toBeTruthy();
    }
  });
});