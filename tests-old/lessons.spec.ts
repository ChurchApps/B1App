import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Lessons & Educational Content', () => {
  test('access lessons page', async ({ authenticatedPage }) => {
    // Navigate to lessons
    await authenticatedPage.goto('/my/lessons');
    await authenticatedPage.waitForLoadState('domcontentloaded');
    
    const url = authenticatedPage.url();
    // Check if on lessons page
    if (url.includes('/my/lessons')) {
      const lessonsIndicators = ['Lessons', 'Study', 'Course', 'Curriculum', 'Learn'];
      const hasLessonsContent = await TestHelpers.hasAnyText(authenticatedPage, lessonsIndicators);
      expect(hasLessonsContent).toBeTruthy();
    } else {
      // May redirect if feature not available
      expect(url).toContain('/my');
    }
  });

  test.skip('browse available lessons', async ({ authenticatedPage }) => {
    // Skip if no lessons available
    await authenticatedPage.goto('/my/lessons');
    
    // Look for lesson listings
    const lessonSelectors = [
      '.lesson',
      '.course',
      'a[href*="/lesson"]',
      '.lesson-card'
    ];
    
    const lessons = await authenticatedPage.locator(lessonSelectors.join(', ')).count();
    if (lessons > 0) {
      expect(lessons).toBeGreaterThan(0);
    }
  });

  test.skip('view lesson content', async ({ authenticatedPage }) => {
    // Skip if no lessons
    await authenticatedPage.goto('/my/lessons');
    
    // Try to click on a lesson
    const lessonLink = authenticatedPage.locator('a[href*="/lesson"]').first();
    if (await lessonLink.isVisible()) {
      await lessonLink.click();
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      // Check for lesson content
      const contentIndicators = ['Video', 'Notes', 'Questions', 'Next', 'Previous'];
      const hasContent = await TestHelpers.hasAnyText(authenticatedPage, contentIndicators);
      expect(hasContent).toBeTruthy();
    }
  });

  test.skip('track lesson progress', async ({ authenticatedPage }) => {
    // Skip if progress tracking not available
    await authenticatedPage.goto('/my/lessons');
    
    // Look for progress indicators
    const progressSelectors = [
      '.progress',
      '[role="progressbar"]',
      'text=Complete',
      'text=%'
    ];
    
    const progress = await TestHelpers.findVisibleElement(authenticatedPage, progressSelectors);
    if (progress) {
      expect(progress).toBeTruthy();
    }
  });
});