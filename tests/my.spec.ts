import { test } from '@playwright/test';
import { MyGroupsTests } from './modules/my-groups';

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