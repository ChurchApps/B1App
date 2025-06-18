import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Donations', () => {
  test('successfully login and access donation page', async ({ authenticatedPage }) => {
    // Navigate to the donation page
    await authenticatedPage.goto('/my/donate');
    await authenticatedPage.waitForLoadState('domcontentloaded');
    
    // Verify we're on the donation page
    expect(authenticatedPage.url()).toContain('/my/donate');
    
    // Verify the page has donation-related content
    const donationContent = await TestHelpers.hasAnyText(authenticatedPage, [
      'Donation', 'Give', 'Amount', 'Payment', 'Fund'
    ]);
    
    expect(donationContent).toBeTruthy();
  });
});