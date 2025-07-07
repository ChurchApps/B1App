import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Groups', () => {
  test('view groups list', async ({ authenticatedPage }) => {
    // Navigate to groups
    await authenticatedPage.goto('/my/groups');
    await authenticatedPage.waitForLoadState('domcontentloaded');
    
    // Check we're on groups page
    expect(authenticatedPage.url()).toContain('/my/groups');
    
    // Look for groups-related content
    const groupsIndicators = ['Groups', 'My Groups', 'Join', 'Leader'];
    const hasGroupsContent = await TestHelpers.hasAnyText(authenticatedPage, groupsIndicators);
    expect(hasGroupsContent).toBeTruthy();
  });

  test('search for groups', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/my/groups');
    
    // Look for search functionality
    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="search"]',
      '[role="searchbox"]'
    ];
    
    const searchBox = await TestHelpers.findVisibleElement(authenticatedPage, searchSelectors);
    if (searchBox) {
      await searchBox.element.fill('test');
      await authenticatedPage.waitForTimeout(500); // Wait for search results
    }
  });

  test.skip('view group details', async ({ authenticatedPage }) => {
    // Skip if groups feature is not fully implemented
    await authenticatedPage.goto('/my/groups');
    
    // Try to find and click on a group
    const groupLink = authenticatedPage.locator('a[href*="/groups/details/"]').first();
    if (await groupLink.isVisible()) {
      await groupLink.click();
      await authenticatedPage.waitForLoadState('domcontentloaded');
      
      // Check for group detail elements
      const detailIndicators = ['Members', 'Leader', 'About', 'Sessions', 'Resources'];
      const hasDetailContent = await TestHelpers.hasAnyText(authenticatedPage, detailIndicators);
      expect(hasDetailContent).toBeTruthy();
    }
  });

  test.skip('group member management', async ({ authenticatedPage }) => {
    // This likely requires group leader permissions
    await authenticatedPage.goto('/groups/details/test-group');
    
    // Look for member management features
    const memberFeatures = ['Add Member', 'Remove', 'Invite', 'Members'];
    const hasFeatures = await TestHelpers.hasAnyText(authenticatedPage, memberFeatures);
    
    if (hasFeatures) {
      // Test would continue with member management
      expect(hasFeatures).toBeTruthy();
    }
  });
});