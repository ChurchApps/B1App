import { test } from '@playwright/test';
import { MyGroupsTests } from './modules/my-groups';
import { MyCommunityTests } from './modules/my-community';
import { MyCheckinTests } from './modules/my-checkin';

test.describe('My Portal - Groups Management', () => {
  test('should navigate to My Groups page', async ({ page }) => {
    await MyGroupsTests.navigateToMyGroups(page);
  });

  test('should display groups list or no groups message', async ({ page }) => {
    await MyGroupsTests.viewGroupsList(page);
  });

  test('should handle group card interactions', async ({ page }) => {
    await MyGroupsTests.testGroupCardInteraction(page);
  });

  test('should navigate to and from group details', async ({ page }) => {
    await MyGroupsTests.testGroupDetailsNavigation(page);
  });

  test('should display correctly on different screen sizes', async ({ page }) => {
    await MyGroupsTests.testMyGroupsResponsiveness(page);
  });
});

test.describe('My Portal - Community Directory', () => {
  test('should navigate to Community page', async ({ page }) => {
    await MyCommunityTests.navigateToCommunity(page);
  });

  test('should load initial directory', async ({ page }) => {
    await MyCommunityTests.testInitialDirectoryLoad(page);
  });

  test('should search members by name', async ({ page }) => {
    await MyCommunityTests.searchByName(page);
  });

  test('should search members by group', async ({ page }) => {
    await MyCommunityTests.searchByGroup(page);
  });

  test('should navigate to person profile', async ({ page }) => {
    await MyCommunityTests.navigateToPersonProfile(page);
  });

  test('should display correctly on different screen sizes', async ({ page }) => {
    await MyCommunityTests.testDirectoryResponsiveness(page);
  });
});

test.describe('My Portal - Check-in Functionality', () => {
  test('should navigate to Check-in page', async ({ page }) => {
    await MyCheckinTests.navigateToCheckin(page);
  });

  test('should load initial check-in screen', async ({ page }) => {
    await MyCheckinTests.testInitialCheckinLoad(page);
  });

  test('should handle service selection', async ({ page }) => {
    await MyCheckinTests.testServiceSelection(page);
  });

  test('should handle household member interactions', async ({ page }) => {
    await MyCheckinTests.testHouseholdMemberInteraction(page);
  });

  test('should complete check-in process', async ({ page }) => {
    await MyCheckinTests.testCheckinProcess(page);
  });

  test('should handle unauthenticated access properly', async ({ page }) => {
    await MyCheckinTests.testUnauthenticatedAccess(page);
  });

  test('should display correctly on different screen sizes', async ({ page }) => {
    await MyCheckinTests.testCheckinResponsiveness(page);
  });
});