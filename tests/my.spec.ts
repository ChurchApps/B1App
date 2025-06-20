import { test } from '@playwright/test';
import { MyGroupsTests } from './modules/my-groups';
import { MyCommunityTests } from './modules/my-community';

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