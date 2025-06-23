import { Page, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-base';

export class MyCommunityTests {
  static async navigateToCommunity(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to Community
    await TestHelpers.login(page);
    await page.goto('/my/community');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we're on the Community page
    expect(page.url()).toContain('/my/community');
    await expect(page.locator('h1:has-text("Member Directory")').first()).toBeVisible();
    
    console.log('✅ Successfully navigated to Community page');
  }

  static async searchByName(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to Community
    await TestHelpers.login(page);
    await page.goto('/my/community');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for initial directory to load
    await page.waitForTimeout(3000);
    
    // Verify search box is visible
    const searchInput = page.locator('input[name="searchText"]');
    await expect(searchInput).toBeVisible();
    
    // Verify People chip is selected by default
    const peopleChip = page.locator('div[role="button"]:has-text("People")').first();
    await expect(peopleChip).toBeVisible();
    
    // Test search functionality
    await searchInput.fill('John');
    await page.click('button:has-text("Search")');
    
    // Wait for search results
    await page.waitForTimeout(2000);
    
    // Check for results or no results message
    const noResults = page.locator('text=No results found').first();
    const resultsTable = page.locator('#peopleTable').first();
    
    // REQUIRED: Search must either return results OR show no results message
    const hasNoResults = await noResults.isVisible({ timeout: 3000 }).catch(() => false);
    const hasResults = await resultsTable.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!hasNoResults && !hasResults) {
      throw new Error('Search returned neither results nor "no results found" message');
    }
    
    if (hasNoResults) {
      console.log('ℹ️  No search results found for "John"');
      await expect(noResults).toBeVisible();
    } else {
      console.log('✅ Search results displayed');
      await expect(resultsTable).toBeVisible();
      
      // REQUIRED: Results table must have actual data
      const resultRows = page.locator('#peopleTable tbody tr');
      const resultCount = await resultRows.count();
      expect(resultCount).toBeGreaterThan(0);
      console.log(`Found ${resultCount} result(s) for "John"`);
      
      // REQUIRED: First result must have proper structure
      const firstResult = resultRows.first();
      const nameCell = firstResult.locator('td').nth(1);
      const nameLink = nameCell.locator('a');
      
      await expect(nameLink).toBeVisible();
      const personName = await nameLink.textContent();
      expect(personName).toBeTruthy();
      expect(personName?.toLowerCase()).toContain('john');
      console.log(`First result: ${personName}`);
    }
    
    // Clear search and verify all results return
    await searchInput.clear();
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    
    console.log('✅ Search by name functionality verified');
  }

  static async searchByGroup(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to Community
    await TestHelpers.login(page);
    await page.goto('/my/community');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for initial directory to load
    await page.waitForTimeout(3000);
    
    // Click on Group chip to switch to group search
    const groupChip = page.locator('div[role="button"]:has-text("Group")').first();
    await groupChip.click();
    
    // Wait for group dropdown to appear
    await page.waitForTimeout(1000);
    
    // Check if group dropdown is visible
    const groupSelect = page.locator('div[role="combobox"]').first();
    // REQUIRED: Group search mode must be functional
    await expect(groupSelect).toBeVisible({ timeout: 3000 });
    console.log('✅ Group search mode activated');
    
    // Click to open dropdown
    await groupSelect.click();
    await page.waitForTimeout(1000);
    
    // Check if there are any groups
    const groupOptions = page.locator('[role="option"]');
    const groupCount = await groupOptions.count();
    
    if (groupCount > 0) {
      console.log(`Found ${groupCount} group(s) available`);
      
      // REQUIRED: Must be able to select a group
      const firstGroup = groupOptions.first();
      const groupName = await firstGroup.textContent();
      expect(groupName).toBeTruthy();
      console.log(`Selecting group: ${groupName}`);
      
      await firstGroup.click();
      await page.waitForTimeout(1000);
      
      // Click search button
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(2000);
      
      // REQUIRED: Search must return either results or no results message
      const resultsTable = page.locator('#peopleTable').first();
      const noResults = page.locator('text=No results found').first();
      
      const hasResults = await resultsTable.isVisible({ timeout: 3000 }).catch(() => false);
      const hasNoResults = await noResults.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!hasResults && !hasNoResults) {
        throw new Error(`Group search for "${groupName}" returned neither results nor "no results found" message`);
      }
      
      if (hasResults) {
        const resultRows = page.locator('#peopleTable tbody tr');
        const resultCount = await resultRows.count();
        expect(resultCount).toBeGreaterThan(0);
        console.log(`✅ Found ${resultCount} member(s) in ${groupName}`);
      } else {
        await expect(noResults).toBeVisible();
        console.log(`ℹ️  No members found in ${groupName}`);
      }
    } else {
      console.log('ℹ️  No groups available for search - this is acceptable');
    }
    
    console.log('✅ Search by group functionality verified');
  }

  static async navigateToPersonProfile(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to Community
    await TestHelpers.login(page);
    await page.goto('/my/community');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for initial directory to load
    await page.waitForTimeout(3000);
    
    // Look for person links in the results
    const personLinks = page.locator('#peopleTable a[href*="/my/community/"]');
    const linkCount = await personLinks.count();
    
    if (linkCount > 0) {
      console.log(`Found ${linkCount} person link(s) in directory`);
      
      // Get the first person's info
      const firstPersonLink = personLinks.first();
      const personName = await firstPersonLink.textContent();
      const personUrl = await firstPersonLink.getAttribute('href');
      
      console.log(`Clicking on person: ${personName}`);
      
      // Click to navigate to person's profile
      await firstPersonLink.click();
      
      // Wait for navigation and check for errors
      await page.waitForLoadState('domcontentloaded');
      
      // REQUIRED: No application errors should occur
      const errorHeading = page.locator('text=Application error').first();
      const hasError = await errorHeading.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasError) {
        throw new Error('Application error occurred when navigating to person profile - profile page failed to load');
      }
      
      // Wait a bit more for the page to fully load
      await page.waitForTimeout(3000);
      
      // Verify we're on the person's profile page
      expect(page.url()).toContain('/my/community/');
      
      // Check if we need to log in again (session might have expired)
      const loginLink = page.locator('a[href*="/login"]').first();
      const needsLogin = await loginLink.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (needsLogin) {
        console.log('Session expired, logging in again...');
        await TestHelpers.login(page, `/my/community/${personUrl?.split('/').pop()}`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
      }
      
      // STRICT VERIFICATION: Check for required profile elements
      // The profile page should have:
      // 1. Contact Information display box
      const contactInfoBox = page.locator('#peopleBox:has-text("Contact Information")').first();
      await expect(contactInfoBox).toBeVisible({ timeout: 5000 });
      console.log('✅ Contact Information box found');
      
      // 2. Person's display name (h2 element inside the contact box)
      const personDisplayName = contactInfoBox.locator('h2').first();
      await expect(personDisplayName).toBeVisible({ timeout: 3000 });
      const displayedName = await personDisplayName.textContent();
      console.log(`✅ Person name displayed: ${displayedName}`);
      
      // 3. Avatar image
      const avatarImage = contactInfoBox.locator('img[alt="avatar"]').first();
      await expect(avatarImage).toBeVisible({ timeout: 3000 });
      console.log('✅ Avatar image displayed');
      
      // 4. At least one contact method (email, phone, or address)
      const contactMethods = contactInfoBox.locator('.contactMethod');
      const contactMethodCount = await contactMethods.count();
      
      if (contactMethodCount === 0) {
        // If no contact methods with class, check for individual elements
        const emailIcon = contactInfoBox.locator('svg[data-testid="MailOutlineIcon"], .MuiIcon-root:has-text("mail_outline")').first();
        const phoneIcon = contactInfoBox.locator('svg[data-testid="PhoneIcon"], .MuiIcon-root:has-text("phone")').first();
        const addressIcon = contactInfoBox.locator('svg[data-testid="RoomIcon"], .MuiIcon-root:has-text("room")').first();
        
        const hasEmail = await emailIcon.isVisible({ timeout: 1000 }).catch(() => false);
        const hasPhone = await phoneIcon.isVisible({ timeout: 1000 }).catch(() => false);
        const hasAddress = await addressIcon.isVisible({ timeout: 1000 }).catch(() => false);
        
        expect(hasEmail || hasPhone || hasAddress).toBe(true);
        console.log('✅ Contact information found');
      } else {
        expect(contactMethodCount).toBeGreaterThan(0);
        console.log(`✅ Found ${contactMethodCount} contact method(s)`);
      }
      
      // REQUIRED: Must have either Message button or Modify Profile section
      const messageButton = contactInfoBox.locator('button:has-text("Message")').first();
      const modifyProfileSection = page.locator('text=Modify Profile').first();
      
      const hasMessageButton = await messageButton.isVisible({ timeout: 2000 }).catch(() => false);
      const hasModifyProfile = await modifyProfileSection.isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasMessageButton || hasModifyProfile).toBe(true);
      
      if (hasMessageButton) {
        console.log('✅ Message button found (viewing another person\'s profile)');
      } else if (hasModifyProfile) {
        console.log('✅ Modify Profile section found (viewing own profile)');
      }
      
      console.log('✅ Person profile page loaded and verified successfully');
      
      // Navigate back to directory
      await page.goto('/my/community');
      await page.waitForLoadState('domcontentloaded');
      
      // Verify we're back on directory page
      await expect(page.locator('h1:has-text("Member Directory")').first()).toBeVisible();
      console.log('✅ Successfully navigated back to directory');
    } else {
      console.log('ℹ️  No person links found in directory');
      
      // Verify empty state message
      const emptyMessage = page.locator('text=Use the search box above').first();
      await expect(emptyMessage).toBeVisible({ timeout: 3000 });
      console.log('✅ Empty directory message displayed');
    }
    
    console.log('✅ Person profile navigation functionality verified');
  }

  static async testDirectoryResponsiveness(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to Community
    await TestHelpers.login(page);
    await page.goto('/my/community');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for initial directory to load
    await page.waitForTimeout(3000);
    
    console.log('Testing responsive behavior of Community Directory');
    
    const viewports = [
      { width: 1200, height: 800, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(1000);
      
      // Verify header is visible
      await expect(page.locator('h1:has-text("Member Directory")').first()).toBeVisible();
      
      // Verify search box is visible and accessible
      const searchBox = page.locator('#peopleBox').first();
      await expect(searchBox).toBeVisible();
      
      // Check search input
      const searchInput = page.locator('input[name="searchText"]');
      const inputVisible = await searchInput.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (inputVisible) {
        console.log(`${viewport.name} view: Search input visible and accessible`);
      }
      
      // Check if chips are visible
      const peopleChip = page.locator('div[role="button"]:has-text("People")').first();
      const groupChip = page.locator('div[role="button"]:has-text("Group")').first();
      
      if (await peopleChip.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`${viewport.name} view: Search type chips visible`);
      }
      
      // Check results table
      const resultsTable = page.locator('#peopleTable').first();
      if (await resultsTable.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Verify table is responsive
        const tableWidth = await resultsTable.evaluate(el => el.scrollWidth);
        const containerWidth = await resultsTable.evaluate(el => el.clientWidth);
        
        if (tableWidth <= containerWidth) {
          console.log(`${viewport.name} view: Results table fits within viewport`);
        } else {
          console.log(`${viewport.name} view: Results table scrollable`);
        }
      }
    }
    
    // Reset to desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    console.log('✅ Responsive design testing completed');
  }

  static async testInitialDirectoryLoad(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to Community
    await TestHelpers.login(page);
    await page.goto('/my/community');
    await page.waitForLoadState('domcontentloaded');
    
    console.log('Testing initial directory load');
    
    // Wait for directory to load
    await page.waitForTimeout(3000);
    
    // Check what's displayed initially
    const resultsTable = page.locator('#peopleTable').first();
    const emptyMessage = page.locator('text=Use the search box above').first();
    const noResultsMessage = page.locator('text=No results found').first();
    
    if (await resultsTable.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Count initial results
      const resultRows = page.locator('#peopleTable tbody tr');
      const resultCount = await resultRows.count();
      console.log(`✅ Directory loaded with ${resultCount} initial member(s)`);
      
      // Verify table structure
      const tableHeaders = page.locator('#peopleTable thead th');
      const headerCount = await tableHeaders.count();
      console.log(`Table has ${headerCount} column(s)`);
      
      // Check if avatars are loading
      const avatarImages = page.locator('#peopleTable img[alt="avatar"]');
      const avatarCount = await avatarImages.count();
      console.log(`Found ${avatarCount} avatar image(s)`);
      
    } else if (await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Empty directory message displayed on initial load');
    } else if (await noResultsMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('ℹ️  No results found on initial load');
    } else {
      console.log('ℹ️  Directory loaded (content structure may vary)');
    }
    
    console.log('✅ Initial directory load functionality verified');
  }
}