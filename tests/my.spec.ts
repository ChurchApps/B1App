import { test } from '@playwright/test';
import { MyGroupsTests } from './modules/my-groups';
import { MyCommunityTests } from './modules/my-community';
import { MyCheckinTests } from './modules/my-checkin';
import { MyDonationsTests } from './modules/my-donations';
import { MyPlansTests } from './modules/my-plans';

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

test.describe('My Portal - Donations Management', () => {
  test('should navigate to Donations page', async ({ page }) => {
    await MyDonationsTests.navigateToDonations(page);
  });

  test('should load initial donations screen', async ({ page }) => {
    await MyDonationsTests.testInitialDonationsLoad(page);
  });

  test('should add payment method', async ({ page }) => {
    await MyDonationsTests.addPaymentMethod(page);
  });

  test('should make one-time donation', async ({ page }) => {
    await MyDonationsTests.makeOneTimeDonation(page);
  });

  test('should verify donation appears in history', async ({ page }) => {
    await MyDonationsTests.verifyDonationHistory(page);
  });

  test('should add recurring donation', async ({ page }) => {
    await MyDonationsTests.addRecurringDonation(page);
  });

  test('should delete recurring donation', async ({ page }) => {
    await MyDonationsTests.deleteRecurringDonation(page);
  });

  test('should delete payment method', async ({ page }) => {
    await MyDonationsTests.deletePaymentMethod(page);
  });

  test('should display correctly on different screen sizes', async ({ page }) => {
    await MyDonationsTests.testDonationsResponsiveness(page);
  });
});

test.describe('My Portal - Plans Management', () => {
  test('should navigate to Plans page', async ({ page }) => {
    await MyPlansTests.navigateToPlans(page);
  });

  test('should load initial plans screen', async ({ page }) => {
    await MyPlansTests.testInitialPlansLoad(page);
  });

  test('should display serving times section correctly', async ({ page }) => {
    await MyPlansTests.testServingTimesSection(page);
  });

  test('should display upcoming dates section correctly', async ({ page }) => {
    await MyPlansTests.testUpcomingDatesSection(page);
  });

  test('should display blockout dates section correctly', async ({ page }) => {
    await MyPlansTests.testBlockoutDatesSection(page);
  });

  test('should add blockout date', async ({ page }) => {
    await MyPlansTests.testAddBlockoutDate(page);
  });

  test('should navigate to plan details', async ({ page }) => {
    await MyPlansTests.testNavigateToPlanDetails(page);
  });

  test('should handle unauthenticated access properly', async ({ page }) => {
    await MyPlansTests.testUnauthenticatedAccess(page);
  });

  test('should display correctly on different screen sizes', async ({ page }) => {
    await MyPlansTests.testPlansResponsiveness(page);
  });
});