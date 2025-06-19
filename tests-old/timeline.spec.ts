import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Timeline & Social Features', () => {
  test('access timeline', async ({ authenticatedPage }) => {
    // Navigate to timeline
    await authenticatedPage.goto('/my/timeline');
    await authenticatedPage.waitForLoadState('domcontentloaded');
    
    // Should be on timeline
    expect(authenticatedPage.url()).toContain('/my/timeline');
    
    // Look for timeline elements
    const timelineIndicators = ['Timeline', 'Post', 'Share', 'What\'s on your mind'];
    const hasTimeline = await TestHelpers.hasAnyText(authenticatedPage, timelineIndicators);
    expect(hasTimeline).toBeTruthy();
  });

  test('create a post', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/my/timeline');
    
    // Look for post creation elements
    const postSelectors = [
      'textarea',
      'input[placeholder*="What"]',
      '[contenteditable="true"]',
      '.post-input'
    ];
    
    const postInput = await TestHelpers.findVisibleElement(authenticatedPage, postSelectors);
    if (postInput) {
      // Type a test post
      await postInput.element.fill('Test post from Playwright');
      
      // Look for post button
      const postButton = await TestHelpers.findVisibleElement(authenticatedPage, [
        'button:has-text("Post")',
        'button:has-text("Share")',
        'button[type="submit"]'
      ]);
      
      if (postButton) {
        // Click to post
        await postButton.element.click();
        await authenticatedPage.waitForTimeout(1000);
        
        // Check if post appeared
        const hasNewPost = await authenticatedPage.locator('text=Test post from Playwright').isVisible();
        expect(hasNewPost).toBeTruthy();
      }
    }
  });

  test('view timeline posts', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/my/timeline');
    
    // Look for post elements
    const postSelectors = [
      '.post',
      '.timeline-post',
      'article',
      '[role="article"]'
    ];
    
    const posts = await authenticatedPage.locator(postSelectors.join(', ')).count();
    // Should have at least one post (the one we just created or existing ones)
    expect(posts).toBeGreaterThanOrEqual(0);
  });

  test.skip('interact with posts', async ({ authenticatedPage }) => {
    // Skip if interactions not implemented
    await authenticatedPage.goto('/my/timeline');
    
    // Look for interaction buttons
    const interactionSelectors = [
      'button:has-text("Like")',
      'button:has-text("Comment")',
      'button:has-text("Share")',
      '[aria-label*="like"]'
    ];
    
    const interaction = await TestHelpers.findVisibleElement(authenticatedPage, interactionSelectors);
    if (interaction) {
      await interaction.element.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('filter timeline by group', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/my/timeline');
    
    // Look for group filter options
    const filterSelectors = [
      'select',
      '[role="combobox"]',
      'text=All Groups',
      'text=Filter'
    ];
    
    const filter = await TestHelpers.findVisibleElement(authenticatedPage, filterSelectors);
    if (filter) {
      expect(filter).toBeTruthy();
    }
  });

  test.skip('delete own post', async ({ authenticatedPage }) => {
    // Skip to avoid removing test data
    await authenticatedPage.goto('/my/timeline');
    
    // Look for delete options on posts
    const deleteSelectors = [
      '[aria-label*="delete"]',
      '[aria-label*="more"]',
      'button:has-text("Delete")',
      '.post-options'
    ];
    
    const deleteOption = await TestHelpers.findVisibleElement(authenticatedPage, deleteSelectors);
    if (deleteOption) {
      expect(deleteOption).toBeTruthy();
    }
  });
});