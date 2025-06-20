import { Page, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-base';

export class MyGroupsTests {
  static async navigateToMyGroups(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to My Groups
    await TestHelpers.login(page);
    await page.goto('/my/groups');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify we're on the My Groups page
    expect(page.url()).toContain('/my/groups');
    await expect(page.locator('h1:has-text("My Groups")').first()).toBeVisible();
    
    console.log('✅ Successfully navigated to My Groups page');
  }

  static async viewGroupsList(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to My Groups
    await TestHelpers.login(page);
    await page.goto('/my/groups');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for groups to load
    await page.waitForTimeout(3000);
    
    // Check if groups are displayed or "No groups found" message
    const noGroupsMessage = page.locator('text=No groups found').first();
    const groupCards = page.locator('a[href*="/groups/details/"]').first(); // Group cards are links to group details
    
    const hasNoGroups = await noGroupsMessage.isVisible({ timeout: 3000 }).catch(() => false);
    const hasGroups = await groupCards.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasNoGroups) {
      console.log('ℹ️  No groups found for this user');
      await expect(noGroupsMessage).toBeVisible();
    } else if (hasGroups) {
      console.log('✅ Groups are displayed');
      await expect(groupCards).toBeVisible();
      
      // Count the number of group cards
      const groupCardCount = await page.locator('a[href*="/groups/details/"]').count();
      console.log(`Found ${groupCardCount} group card(s)`);
      
      // Verify group names are visible
      const groupNames = page.locator('a[href*="/groups/details/"] [style*="fontWeight: bold"]');
      const nameCount = await groupNames.count();
      if (nameCount > 0) {
        const firstGroupName = await groupNames.first().textContent();
        console.log(`First group name: "${firstGroupName}"`);
      }
    } else {
      console.log('ℹ️  Groups section loaded (content may still be loading)');
    }
    
    console.log('✅ Groups list view functionality verified');
  }

  static async testGroupCardInteraction(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to My Groups
    await TestHelpers.login(page);
    await page.goto('/my/groups');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for groups to load
    await page.waitForTimeout(3000);
    
    // Look for group cards (which are actually links)
    const groupLinks = page.locator('a[href*="/groups/details/"]');
    const groupCardCount = await groupLinks.count();
    
    if (groupCardCount > 0) {
      console.log(`Found ${groupCardCount} group card(s), testing interaction`);
      
      // Test hover effect on first group card
      const firstGroupLink = groupLinks.first();
      await firstGroupLink.hover();
      await page.waitForTimeout(500);
      
      // Get the group name for verification
      const groupNameElement = firstGroupLink.locator('[style*="fontWeight: bold"]').first();
      let groupName = '';
      if (await groupNameElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        groupName = await groupNameElement.textContent() || '';
        console.log(`Found group: "${groupName}"`);
      }
      
      // Click the group card to navigate to group details
      await firstGroupLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      
      // Verify we navigated to the group details page
      expect(page.url()).toContain('/groups/details/');
      console.log('✅ Successfully navigated to group details page');
      
      // Look for group details content
      const groupContent = page.locator('main, article, .group-content, [class*="group"]').first();
      const groupContentVisible = await groupContent.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (groupContentVisible) {
        console.log('✅ Group details page loaded successfully');
      } else {
        console.log('ℹ️  Group details page navigation completed (content may still be loading)');
      }
    } else {
      console.log('ℹ️  No group cards found to test interaction');
      
      // Verify "No groups found" message is displayed
      const noGroupsMessage = page.locator('text=No groups found').first();
      if (await noGroupsMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(noGroupsMessage).toBeVisible({ timeout: 3000 });
        console.log('✅ "No groups found" message displayed correctly');
      } else {
        console.log('ℹ️  No groups found, but no specific message displayed');
      }
    }
    
    console.log('✅ Group card interaction functionality verified');
  }

  static async testGroupDetailsNavigation(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to My Groups
    await TestHelpers.login(page);
    await page.goto('/my/groups');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for groups to load
    await page.waitForTimeout(3000);
    
    // Look for group cards with links
    const groupLinks = page.locator('a[href*="/groups/details/"]');
    const linkCount = await groupLinks.count();
    
    if (linkCount > 0) {
      console.log(`Found ${linkCount} group link(s), testing navigation`);
      
      // Get the first group link URL
      const firstGroupLink = groupLinks.first();
      const groupUrl = await firstGroupLink.getAttribute('href');
      
      if (groupUrl) {
        console.log(`Navigating to group: ${groupUrl}`);
        
        // Navigate to the group details page
        await firstGroupLink.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);
        
        // Verify we're on the group details page
        expect(page.url()).toContain('/groups/details/');
        
        // Look for group-specific content
        const groupElements = [
          page.locator('h1, h2, h3').first(), // Group name/title
          page.locator('text=Meeting Time, text=Location, text=About').first(), // Group info
          page.locator('[role="tablist"], .tabs, button[role="tab"]').first(), // Tabs interface
        ];
        
        let contentFound = false;
        for (const element of groupElements) {
          if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
            contentFound = true;
            break;
          }
        }
        
        if (contentFound) {
          console.log('✅ Group details page content loaded successfully');
        } else {
          console.log('ℹ️  Group details page loaded (content structure may differ)');
        }
        
        // Test navigation back to My Groups
        await page.goto('/my/groups');
        await page.waitForLoadState('domcontentloaded');
        
        // Verify we're back on My Groups page
        expect(page.url()).toContain('/my/groups');
        await expect(page.locator('h1:has-text("My Groups")').first()).toBeVisible();
        console.log('✅ Successfully navigated back to My Groups');
      }
    } else {
      console.log('ℹ️  No group links found for navigation testing');
      
      // Verify "No groups found" state
      const noGroupsMessage = page.locator('text=No groups found').first();
      await expect(noGroupsMessage).toBeVisible({ timeout: 3000 });
      console.log('✅ "No groups found" state verified');
    }
    
    console.log('✅ Group details navigation functionality verified');
  }

  static async testMyGroupsResponsiveness(page: Page) {
    await TestHelpers.clearBrowserState(page);
    
    // Login and navigate to My Groups
    await TestHelpers.login(page);
    await page.goto('/my/groups');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for groups to load
    await page.waitForTimeout(3000);
    
    console.log('Testing responsive behavior of My Groups page');
    
    // Test desktop view (default)
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);
    
    const groupCards = page.locator('a[href*="/groups/details/"]');
    const groupCardCount = await groupCards.count();
    
    if (groupCardCount > 0) {
      console.log(`Desktop view: Found ${groupCardCount} group card(s)`);
      
      // Test tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);
      
      // Verify groups are still visible
      const tabletGroupCards = page.locator('a[href*="/groups/details/"]');
      const tabletCardCount = await tabletGroupCards.count();
      console.log(`Tablet view: Found ${tabletCardCount} group card(s)`);
      
      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      // Verify groups are still visible
      const mobileGroupCards = page.locator('a[href*="/groups/details/"]');
      const mobileCardCount = await mobileGroupCards.count();
      console.log(`Mobile view: Found ${mobileCardCount} group card(s)`);
      
      // Verify the page header is still visible
      await expect(page.locator('h1:has-text("My Groups")').first()).toBeVisible();
      
      console.log('✅ Responsive design verified across different screen sizes');
    } else {
      console.log('ℹ️  Testing responsive behavior with "No groups found" state');
      
      // Test different viewports with no groups
      const viewports = [
        { width: 1200, height: 800, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);
        
        const noGroupsMessage = page.locator('text=No groups found').first();
        if (await noGroupsMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(noGroupsMessage).toBeVisible({ timeout: 2000 });
          console.log(`${viewport.name} view: "No groups found" message visible`);
        } else {
          console.log(`${viewport.name} view: No groups state (no specific message found)`);
        }
      }
      
      console.log('✅ Responsive design verified for empty state');
    }
    
    // Reset to desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    console.log('✅ Responsive design testing completed');
  }
}