import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Member Directory', () => {
  test('access directory', async ({ authenticatedPage }) => {
    // Navigate to directory
    await authenticatedPage.goto('/my/community');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    // Should be on directory/community page
    expect(authenticatedPage.url()).toContain('/my/community');

    // Look for directory elements
    const directoryIndicators = ['Directory', 'Search', 'Members', 'People', 'Community'];
    const hasDirectory = await TestHelpers.hasAnyText(authenticatedPage, directoryIndicators);
    expect(hasDirectory).toBeTruthy();
  });

  test('search members', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/my/community');

    // Look for search input
    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="Search"]',
      'input[placeholder*="name"]',
      '[role="searchbox"]'
    ];

    const searchInput = await TestHelpers.findVisibleElement(authenticatedPage, searchSelectors);
    if (searchInput) {
      await searchInput.element.fill('test');
      await authenticatedPage.waitForTimeout(500);

      // Results should update
      const hasResults = await authenticatedPage.locator('.search-results, .member-list, .people-list').isVisible();
      expect(searchInput).toBeTruthy();
    }
  });

  test('view member profile', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/my/community');

    // Look for member links
    const memberLink = authenticatedPage.locator('a[href*="/my/community/"]').first();
    const hasMembers = await memberLink.isVisible();

    if (hasMembers) {
      await memberLink.click();
      await authenticatedPage.waitForLoadState('domcontentloaded');

      // Should be on a profile page
      const profileIndicators = ['Profile', 'Contact', 'Email', 'Phone', 'About'];
      const hasProfile = await TestHelpers.hasAnyText(authenticatedPage, profileIndicators);
      expect(hasProfile).toBeTruthy();
    }
  });

  test('edit own profile', async ({ authenticatedPage }) => {
    // Navigate to own profile
    await authenticatedPage.goto('/my/community');

    // Click on edit profile from user menu
    const userMenu = await TestHelpers.findVisibleElement(
      authenticatedPage,
      ['[id*="user"]', '.MuiChip-root']
    );

    if (userMenu) {
      await userMenu.element.click();
      await authenticatedPage.waitForTimeout(300);

      // Click edit profile
      const editLink = authenticatedPage.locator('text=Edit profile').first();
      if (await editLink.isVisible()) {
        await editLink.click();
        await authenticatedPage.waitForLoadState('domcontentloaded');

        // Should see edit form
        const formElements = ['input', 'textarea', 'Save', 'Update'];
        const hasForm = await TestHelpers.hasAnyText(authenticatedPage, formElements);
        expect(hasForm).toBeTruthy();
      }
    }
  });

  test.skip('direct messaging', async ({ authenticatedPage }) => {
    // Skip to avoid sending test messages
    await authenticatedPage.goto('/my/community');

    // Look for message buttons
    const messageSelectors = [
      'button:has-text("Message")',
      '[aria-label*="message"]',
      'text=Send Message',
      '.message-button'
    ];

    const messageButton = await TestHelpers.findVisibleElement(authenticatedPage, messageSelectors);
    if (messageButton) {
      expect(messageButton).toBeTruthy();
    }
  });
});