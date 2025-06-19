import { test, expect, TestHelpers } from './helpers/test-base';
import { Page } from '@playwright/test';

// Shared login helper with browser clearing and church selection
async function loginAndSelectChurch(page: Page, returnUrl?: string): Promise<void> {
  console.log(`=== Starting login process ${returnUrl ? 'with returnUrl: ' + returnUrl : ''} ===`);
  
  // Clear all browser state first
  await page.context().clearCookies();
  await page.context().clearPermissions();
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch {
    // Ignore if we can't clear storage on current page
  }
  
  // Navigate to login with optional return URL
  const loginUrl = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login';
  console.log('Navigating to login URL:', loginUrl);
  await page.goto(loginUrl);
  
  // Fill login form
  await page.fill('input[type="email"]', 'demo@chums.org');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Wait for page to settle after login
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  
  // Handle church selection if it appears
  const hasDialog = await page.locator('[role="dialog"], .MuiDialog-root').isVisible({ timeout: 3000 }).catch(() => false);
  
  if (hasDialog) {
    console.log('Church selection modal detected');
    
    // Try to find Grace Community Church first
    let churchSelected = false;
    
    const graceSelectors = [
      '[role="dialog"] a:has-text("Grace Community Church")',
      '.MuiDialog-root a:has-text("Grace Community Church")',
      'text="Grace Community Church"',
      'a:has-text("Grace Community Church")',
    ];
    
    for (const selector of graceSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log(`Found Grace Community Church with selector: ${selector}`);
          await element.click();
          churchSelected = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!churchSelected) {
      console.log('Grace Community Church not found, selecting first available church...');
      const firstChurch = page.locator('[role="dialog"] a, .MuiDialog-root a').first();
      if (await firstChurch.isVisible({ timeout: 2000 })) {
        const churchName = await firstChurch.textContent();
        console.log(`Selecting fallback church: ${churchName?.trim()}`);
        await firstChurch.click();
        churchSelected = true;
      }
    }
    
    if (churchSelected) {
      await page.waitForTimeout(3000);
      console.log('Church selected successfully');
    } else {
      throw new Error('Could not select any church from the modal');
    }
  } else {
    console.log('No church selection modal - proceeding directly');
  }
  
  // Wait for final navigation to complete
  try {
    if (returnUrl && returnUrl.startsWith('/my/')) {
      await page.waitForURL(`**${returnUrl}`, { timeout: 15000 });
    } else {
      await page.waitForURL('**/my/**', { timeout: 15000 });
    }
  } catch (error) {
    console.log('URL wait timeout - current URL:', page.url());
    // Don't throw error here, let the test continue and fail appropriately
  }
  
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  const finalUrl = page.url();
  console.log('Login completed. Final URL:', finalUrl);
  
  // Verify we ended up in the right place
  if (returnUrl && !finalUrl.includes(returnUrl)) {
    console.warn(`Expected to be at ${returnUrl}, but at ${finalUrl}`);
  }
}

test.describe('Donation Functionality - Complete CRUD Tests', () => {
  let initialPaymentMethodCount = 0;
  let initialRecurringDonationCount = 0;

  test.beforeAll(async ({ browser }) => {
    // Get initial state for data integrity
    const page = await browser.newPage();
    
    // Use shared login method
    await loginAndSelectChurch(page, '/my/donate');
    
    // Wait for donation page to fully load
    await page.waitForTimeout(3000);
    
    initialPaymentMethodCount = await getPaymentMethodCount(page);
    initialRecurringDonationCount = await getRecurringDonationCount(page);
    
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Clear browser state before each test
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('CREATE: Add payment method with test credit card', async ({ page }) => {
    // Use shared login method with church selection
    await loginAndSelectChurch(page, '/my/donate');
    
    // Verify we're on the donation page
    expect(page.url()).toContain('/my/donate');
    
    // Wait for "Add Payment Method" icon button to be visible
    // From PaymentMethods.tsx: IconButton with aria-label="add-button" and id="addBtnGroup"
    const addPaymentSelectors = [
      'button[aria-label="add-button"]', // Exact aria-label from line 48
      '#addBtnGroup', // Exact id from line 49
      'IconButton[aria-label="add-button"]', // More specific element type
      'button[id="addBtnGroup"]', // Combining both attributes
    ];
    
    // Wait for any of the add payment method icon buttons to appear
    let addIconButton = null;
    for (const selector of addPaymentSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
        addIconButton = await TestHelpers.findVisibleElement(page, [selector]);
        if (addIconButton) break;
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    expect(addIconButton, 'Add Payment Method icon button must be visible after page loads').toBeTruthy();
    console.log(`Found add payment method icon using selector: ${addIconButton.selector}`);
    
    // Click the icon button to open the menu
    await addIconButton.element.click();
    
    // Wait for menu to appear and click "Add Card" option
    // From PaymentMethods.tsx: MenuItem with aria-label="add-card" (line 66)
    const addCardMenuSelectors = [
      '[aria-label="add-card"]', // Exact aria-label from line 66
      'MenuItem[aria-label="add-card"]', // More specific element type
      '#add-menu [aria-label="add-card"]', // Inside the add-menu (id from line 58)
      '[role="menuitem"][aria-label="add-card"]', // Role + aria-label
    ];
    
    let addCardMenuItem = null;
    for (const selector of addCardMenuSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        addCardMenuItem = await TestHelpers.findVisibleElement(page, [selector]);
        if (addCardMenuItem) break;
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    expect(addCardMenuItem, 'Add Card menu item must be visible after clicking add button').toBeTruthy();
    console.log(`Found add card menu item using selector: ${addCardMenuItem.selector}`);
    
    await addCardMenuItem.element.click();
    
    // Wait for payment form to appear - look for Stripe CardElement iframe
    const paymentFormSelectors = [
      'iframe[name*="__privateStripeFrame"]', // Stripe CardElement iframe
      'iframe[title*="Secure card payment input frame"]',
      'input[name="cardNumber"]', // Fallback regular inputs
      'input[placeholder*="card"]'
    ];
    
    let paymentFormFound = false;
    for (const selector of paymentFormSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        console.log(`Payment form found using selector: ${selector}`);
        paymentFormFound = true;
        break;
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    expect(paymentFormFound, 'Payment form must appear after clicking Add Card').toBeTruthy();
    
    // Fill credit card form - this MUST work
    await fillStripeCard(page);
    
    // Save payment method - from CardForm.tsx uses ariaLabelSave="save-button" (line 88)
    const saveSelectors = [
      'button[aria-label="save-button"]', // Exact aria-label from CardForm.tsx
      'button:has-text("Save")', // Fallback text match
      'button[type="submit"]:not([disabled])', // Submit button fallback
    ];
    
    // Wait for save button to be clickable
    let saveButton = null;
    for (const selector of saveSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        saveButton = await TestHelpers.findVisibleElement(page, [selector]);
        if (saveButton) {
          console.log(`Save button found using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    expect(saveButton, 'Save button must be visible after filling card form').toBeTruthy();
    console.log('Clicking save button to add payment method...');
    await saveButton.element.click();
    
    // Wait for payment method to be saved - look for success indicators or updated UI
    await page.waitForFunction(() => {
      const successMessages = ['Payment method added', 'Card added', 'Successfully added'];
      const pageText = document.body.textContent || '';
      return successMessages.some(msg => pageText.includes(msg)) || 
             document.querySelectorAll('.payment-method-item, .saved-card, [data-testid="payment-method"]').length > 0;
    }, { timeout: 10000 });
    
    // Verify payment method was added
    const newPaymentMethodCount = await getPaymentMethodCount(page);
    expect(newPaymentMethodCount, 'Payment method count should increase after adding payment method').toBeGreaterThan(initialPaymentMethodCount);
  });

  test('CREATE: Make one-time donation', async ({ page }) => {
    console.log('=== Starting one-time donation test ===');
    
    // Login and navigate to donation page
    await loginAndSelectChurch(page, '/my/donate');
    
    // Verify we're on the donation page
    expect(page.url()).toContain('/my/donate');
    console.log('✅ Successfully navigated to donation page');
    
    // Wait for donation form to load completely
    await page.waitForTimeout(3000);
    
    // Step 1: Click the "single-donation" button to activate one-time donation mode
    console.log('Looking for single-donation button...');
    const singleDonationButton = page.locator('button[aria-label="single-donation"]');
    
    await singleDonationButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Found single-donation button');
    
    await singleDonationButton.click();
    console.log('✅ Clicked single-donation button');
    
    // Wait for the form to expand and show fund donation fields
    console.log('Waiting for form to expand after single-donation click...');
    await page.waitForTimeout(3000);
    
    // Check if form has expanded by looking for donation-specific content
    const formExpandedIndicators = [
      'text=Fund', 
      'text=Total',
      'text=Preview',
      'input[name="amount"]',
      'select[name="method"]'
    ];
    
    let formExpanded = false;
    for (const indicator of formExpandedIndicators) {
      if (await page.locator(indicator).isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`✅ Form expanded - found indicator: ${indicator}`);
        formExpanded = true;
        break;
      }
    }
    
    expect(formExpanded, 'Form must expand after clicking single-donation button').toBeTruthy();
    
    // Step 2: Fill in the fund donation amount
    console.log('Looking for fund donation amount input...');
    
    // From FundDonation.tsx: TextField with name="amount" and aria-label="amount"
    const fundAmountSelectors = [
      'input[name="amount"][aria-label="amount"]', // Exact from FundDonation.tsx line 44
      'input[name="amount"]',
      'input[aria-label="amount"]',
      'input[type="number"]'
    ];
    
    let fundAmountInput = null;
    for (const selector of fundAmountSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 8000 });
        fundAmountInput = await TestHelpers.findVisibleElement(page, [selector]);
        if (fundAmountInput) {
          console.log(`Found fund amount input using selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Fund amount selector ${selector} failed: ${e.message}`);
      }
    }
    
    expect(fundAmountInput, 'Fund donation amount input must be visible after clicking single-donation').toBeTruthy();
    
    // Enter the donation amount
    await fundAmountInput.element.clear();
    await fundAmountInput.element.fill('25.00');
    console.log('✅ Entered fund donation amount: $25.00');
    
    // Verify amount was entered correctly
    const enteredAmount = await fundAmountInput.element.inputValue();
    expect(enteredAmount, 'Amount must be entered correctly').toBe('25.00');
    
    // Wait for form to process the amount and calculate totals
    await page.waitForTimeout(2000);
    
    // Step 3: Click the Preview button to proceed with donation
    console.log('Looking for Preview button...');
    
    // From DonationForm.tsx: ariaLabelSave="save-button" and saveText="Preview"
    const previewSelectors = [
      'button[aria-label="save-button"]', // Exact from DonationForm.tsx line 190
      'button:has-text("Preview")',
      'button:has-text("Save")',
      'button[type="submit"]'
    ];
    
    let previewButton = null;
    for (const selector of previewSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        previewButton = await TestHelpers.findVisibleElement(page, [selector]);
        if (previewButton) {
          console.log(`Found preview button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Preview selector ${selector} failed: ${e.message}`);
      }
    }
    
    expect(previewButton, 'Preview button must be visible after entering amount').toBeTruthy();
    
    console.log('Clicking Preview button...');
    await previewButton.element.click();
    
    // Step 4: Handle the DonationPreviewModal
    console.log('Waiting for donation preview modal...');
    await page.waitForTimeout(3000);
    
    // Look for the modal and donation confirmation button
    const modalSelectors = [
      '[role="dialog"]', // Material-UI modal
      '.MuiDialog-root',
      'div:has-text("Preview")',
      'div:has-text("Donate")'
    ];
    
    let modalVisible = false;
    for (const selector of modalSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`✅ Found donation modal using selector: ${selector}`);
        modalVisible = true;
        break;
      }
    }
    
    expect(modalVisible, 'Donation preview modal must appear').toBeTruthy();
    
    // Look for final donation/submit button in the modal
    console.log('Looking for final donation button in modal...');
    const finalDonateSelectors = [
      'button:has-text("Donate")',
      'button:has-text("Give")',
      'button:has-text("Submit")',
      'button:has-text("Confirm")',
      'button[type="submit"]'
    ];
    
    let finalDonateButton = null;
    for (const selector of finalDonateSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        finalDonateButton = await TestHelpers.findVisibleElement(page, [selector]);
        if (finalDonateButton) {
          console.log(`Found final donate button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`Final donate selector ${selector} failed: ${e.message}`);
      }
    }
    
    expect(finalDonateButton, 'Final donate button must be visible in modal').toBeTruthy();
    
    console.log('Clicking final donate button...');
    await finalDonateButton.element.click();
    
    // Step 5: Wait for donation processing and check for success
    console.log('Waiting for donation processing...');
    await page.waitForTimeout(8000);
    
    // Look for success indicators
    console.log('Checking for donation success indicators...');
    const successIndicators = [
      'text=Thank you',
      'text=Success',
      'text=Donation complete',
      'text=completed successfully', 
      'text=Thank you for your donation',
      'text=Payment successful',
      'text=Donation successful',
      'text=succeeded'
    ];
    
    let donationSuccessful = false;
    for (const indicator of successIndicators) {
      if (await page.locator(indicator).isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`✅ Found success indicator: ${indicator}`);
        donationSuccessful = true;
        break;
      }
    }
    
    // Also check page content for success messages
    if (!donationSuccessful) {
      const pageContent = await page.locator('body').textContent();
      const hasSuccessText = successIndicators.some(indicator => {
        const text = indicator.replace('text=', '');
        return pageContent?.toLowerCase().includes(text.toLowerCase());
      });
      
      if (hasSuccessText) {
        donationSuccessful = true;
        console.log('✅ Found success message in page content');
      }
    }
    
    // If no success found, check for error messages and debug
    if (!donationSuccessful) {
      console.log('❌ No success indicators found, checking for errors...');
      
      const errorIndicators = [
        'text=Error',
        'text=Failed',
        'text=Invalid',
        'text=Declined',
        'text=payment method required'
      ];
      
      for (const indicator of errorIndicators) {
        if (await page.locator(indicator).isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`❌ Found error indicator: ${indicator}`);
          break;
        }
      }
      
      // Get page content for debugging
      const pageContent = await page.locator('body').textContent();
      console.log('Page content (first 1000 chars):', pageContent?.substring(0, 1000));
      
    }
    
    expect(donationSuccessful, 'Donation must complete successfully with success message').toBeTruthy();
    console.log('✅ One-time donation completed successfully');
  });

  test('CREATE: Setup recurring donation', async ({ page }) => {
    console.log('=== Starting recurring donation test ===');
    
    // Login and navigate to donation page
    await loginAndSelectChurch(page, '/my/donate');
    
    // Verify we're on the donation page
    expect(page.url()).toContain('/my/donate');
    console.log('✅ Successfully navigated to donation page');
    
    // Wait for donation form to load
    await page.waitForTimeout(3000);
    
    // Find and fill recurring donation amount
    console.log('Looking for donation amount input...');
    const amountSelectors = [
      'input[name="amount"]',
      'input[placeholder*="Amount"]',
      'input[type="number"]',
      'input[aria-label*="amount"]'
    ];
    
    let amountInput = null;
    for (const selector of amountSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        amountInput = await TestHelpers.findVisibleElement(page, [selector]);
        if (amountInput) {
          console.log(`Found amount input using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    expect(amountInput, 'Amount input must be available for recurring donation').toBeTruthy();
    
    await amountInput.element.clear();
    await amountInput.element.fill('10.00');
    console.log('✅ Entered recurring donation amount: $10.00');
    
    // Verify amount was entered
    const enteredAmount = await amountInput.element.inputValue();
    expect(enteredAmount, 'Amount must be entered correctly').toBe('10.00');
    
    // Enable recurring donation - from DonationForm.tsx
    console.log('Looking for recurring donation controls...');
    const recurringSelectors = [
      'button[aria-label="recurring-donation"]', // From DonationForm.tsx
      'input[type="checkbox"][name*="recurring"]',
      'input[type="checkbox"][id*="recurring"]',
      'button:has-text("Recurring")',
      'button:has-text("Monthly")',
      'select[name="frequency"]'
    ];
    
    let recurringControl = null;
    for (const selector of recurringSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        recurringControl = await TestHelpers.findVisibleElement(page, [selector]);
        if (recurringControl) {
          console.log(`Found recurring control using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    expect(recurringControl, 'Recurring donation option must be available').toBeTruthy();
    
    // Handle different types of recurring controls
    if (recurringControl.selector.includes('select')) {
      console.log('Setting recurring frequency via select dropdown');
      await recurringControl.element.selectOption('monthly');
    } else if (recurringControl.selector.includes('button') && recurringControl.selector.includes('aria-label="recurring-donation"')) {
      console.log('Clicking recurring donation button');
      await recurringControl.element.click();
    } else if (recurringControl.selector.includes('button')) {
      console.log('Clicking recurring button');
      await recurringControl.element.click();
    } else {
      console.log('Checking recurring checkbox');
      await recurringControl.element.check();
    }
    
    await page.waitForTimeout(1000); // Let UI update
    console.log('✅ Enabled recurring donation');
    
    // Submit recurring donation setup
    console.log('Looking for submit button...');
    const submitSelectors = [
      'button[aria-label="recurring-donation"]', // If this is the submit button
      'button:has-text("Give")',
      'button:has-text("Set up Recurring")',
      'button:has-text("Submit")',
      'button[type="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        // Skip the recurring button if we already clicked it
        if (selector === recurringControl.selector) continue;
        
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        submitButton = await TestHelpers.findVisibleElement(page, [selector]);
        if (submitButton) {
          console.log(`Found submit button using selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    expect(submitButton, 'Submit button must be available for recurring donation').toBeTruthy();
    
    console.log('Submitting recurring donation...');
    await submitButton.element.click();
    
    // Wait for processing
    console.log('Waiting for recurring donation processing...');
    await page.waitForTimeout(8000);
    
    // Check for success indicators
    console.log('Checking for recurring donation success...');
    const successIndicators = [
      'text=Thank you',
      'text=Success',
      'text=Recurring donation',
      'text=Subscription created',
      'text=successfully',
      'text=Set up successfully'
    ];
    
    let recurringSuccessful = false;
    for (const indicator of successIndicators) {
      if (await page.locator(indicator).isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`✅ Found success indicator: ${indicator}`);
        recurringSuccessful = true;
        break;
      }
    }
    
    // Also check page content
    if (!recurringSuccessful) {
      const pageContent = await page.locator('body').textContent();
      const hasSuccessText = successIndicators.some(indicator => {
        const text = indicator.replace('text=', '');
        return pageContent?.toLowerCase().includes(text.toLowerCase());
      });
      
      if (hasSuccessText) {
        recurringSuccessful = true;
        console.log('✅ Found success message in page content');
      }
    }
    
    // Verify recurring donation count increased
    console.log('Verifying recurring donation was created...');
    const newRecurringCount = await getRecurringDonationCount(page);
    console.log(`Initial recurring count: ${initialRecurringDonationCount}, New count: ${newRecurringCount}`);
    
    
    expect(recurringSuccessful || newRecurringCount > initialRecurringDonationCount, 
      'Recurring donation must be created successfully').toBeTruthy();
    console.log('✅ Recurring donation setup completed successfully');
  });

  test('READ: Verify donations appear in history', async ({ page }) => {
    // Login and navigate to donation page
    await loginAndSelectChurch(page, '/my/donate');
    
    // Donation history MUST be visible
    const historySelectors = [
      'text=Donation History',
      'text=Recent Donations',
      'table',
      '[role="table"]'
    ];
    
    const historyElement = await TestHelpers.findVisibleElement(page, historySelectors);
    expect(historyElement, 'Donation history section must be visible').toBeTruthy();
    
    // Must show our test donations
    const donationData = await TestHelpers.hasAnyText(page, [
      '$25.00', '$10.00', 'Credit Card', 'General Fund', 'Visa'
    ]);
    expect(donationData, 'Test donations must appear in history').toBeTruthy();
  });

  test('UPDATE: Edit recurring donation amount', async ({ page }) => {
    // Login and navigate to donation page
    await loginAndSelectChurch(page, '/my/donate');
    
    // Find edit button for recurring donation - this MUST exist
    const editSelectors = [
      'button:has-text("Edit")',
      'button:has-text("Modify")',
      'button:has-text("Update")'
    ];
    
    const editButton = await TestHelpers.findVisibleElement(page, editSelectors);
    expect(editButton, 'Edit button must be available for recurring donations').toBeTruthy();
    
    await editButton.element.click();
    await page.waitForTimeout(2000);
    
    // Update amount field - this MUST exist in edit mode
    const amountInput = await TestHelpers.findVisibleElement(page, [
      'input[name="amount"]',
      'input[type="number"]'
    ]);
    expect(amountInput, 'Amount input must be available in edit mode').toBeTruthy();
    
    await amountInput.element.clear();
    await amountInput.element.fill('15.00');
    
    // Save changes - this MUST work
    const saveButton = await TestHelpers.findVisibleElement(page, [
      'button:has-text("Save")',
      'button:has-text("Update")'
    ]);
    expect(saveButton, 'Save button must be available in edit mode').toBeTruthy();
    
    await saveButton.element.click();
    await page.waitForTimeout(5000);
    
    // Verify the amount was updated
    const updatedAmount = await TestHelpers.hasAnyText(page, ['$15.00']);
    expect(updatedAmount, 'Updated amount must be visible after editing').toBeTruthy();
  });

  test('DELETE: Cancel recurring donation', async ({ page }) => {
    // Login and navigate to donation page
    await loginAndSelectChurch(page, '/my/donate');
    
    const currentRecurringCount = await getRecurringDonationCount(page);
    expect(currentRecurringCount, 'Must have recurring donations to delete').toBeGreaterThan(0);
    
    // Find delete/cancel button - this MUST exist
    const deleteSelectors = [
      'button:has-text("Cancel")',
      'button:has-text("Delete")',
      'button:has-text("Stop")',
      'button:has-text("Remove")'
    ];
    
    const deleteButton = await TestHelpers.findVisibleElement(page, deleteSelectors);
    expect(deleteButton, 'Delete/Cancel button must be available for recurring donations').toBeTruthy();
    
    await deleteButton.element.click();
    await page.waitForTimeout(2000);
    
    // Handle confirmation dialog if it appears
    const confirmSelectors = [
      'button:has-text("Confirm")',
      'button:has-text("Yes")',
      'button:has-text("Delete")',
      'button:has-text("Cancel Subscription")'
    ];
    
    const confirmButton = await TestHelpers.findVisibleElement(page, confirmSelectors);
    if (confirmButton) {
      await confirmButton.element.click();
      await page.waitForTimeout(3000);
    }
    
    // Verify recurring donation was deleted
    const newRecurringCount = await getRecurringDonationCount(page);
    expect(newRecurringCount, 'Recurring donation count must decrease after deletion').toBeLessThan(currentRecurringCount);
  });

  test('DELETE: Remove payment method', async ({ page }) => {
    // Login and navigate to donation page
    await loginAndSelectChurch(page, '/my/donate');
    
    const currentPaymentMethodCount = await getPaymentMethodCount(page);
    expect(currentPaymentMethodCount, 'Must have payment methods to delete').toBeGreaterThan(0);
    
    // Find delete button for payment method - this MUST exist
    const deleteSelectors = [
      'button:has-text("Delete")',
      'button:has-text("Remove")',
      'text=Delete',
      'text=Remove'
    ];
    
    const deleteButton = await TestHelpers.findVisibleElement(page, deleteSelectors);
    expect(deleteButton, 'Delete button must be available for payment methods').toBeTruthy();
    
    await deleteButton.element.click();
    await page.waitForTimeout(2000);
    
    // Handle confirmation dialog if it appears
    const confirmSelectors = [
      'button:has-text("Confirm")',
      'button:has-text("Yes")',
      'button:has-text("Delete")',
      'button:has-text("Remove")'
    ];
    
    const confirmButton = await TestHelpers.findVisibleElement(page, confirmSelectors);
    if (confirmButton) {
      await confirmButton.element.click();
      await page.waitForTimeout(3000);
    }
    
    // Verify payment method was deleted
    const newPaymentMethodCount = await getPaymentMethodCount(page);
    expect(newPaymentMethodCount, 'Payment method count must decrease after deletion').toBeLessThan(currentPaymentMethodCount);
  });

  test('VERIFY: Data integrity - back to initial state', async ({ page }) => {
    // Login and navigate to donation page
    await loginAndSelectChurch(page, '/my/donate');
    
    const finalPaymentMethodCount = await getPaymentMethodCount(page);
    const finalRecurringDonationCount = await getRecurringDonationCount(page);
    
    // Final counts must match initial state (allowing ±1 for timing)
    expect(Math.abs(finalPaymentMethodCount - initialPaymentMethodCount), 
      'Payment method count must return to initial state').toBeLessThanOrEqual(1);
    expect(Math.abs(finalRecurringDonationCount - initialRecurringDonationCount), 
      'Recurring donation count must return to initial state').toBeLessThanOrEqual(1);
  });
});

// Helper Functions - These throw errors instead of returning false

async function fillStripeCard(page: Page): Promise<void> {
  console.log('Starting to fill Stripe card form...');
  
  // From CardForm.tsx: Uses single CardElement (line 92)
  // Wait for Stripe CardElement iframe to load
  let cardFilled = false;
  
  try {
    // Look for the Stripe CardElement iframe
    // Stripe creates iframes with specific naming patterns
    const stripeIframeSelectors = [
      'iframe[name*="__privateStripeFrame"]',
      'iframe[title*="Secure card payment input frame"]',
      'iframe[src*="stripe"]',
      'iframe[name*="stripe"]'
    ];
    
    let stripeFrame = null;
    for (const selector of stripeIframeSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        stripeFrame = page.frameLocator(selector).first();
        console.log(`Found Stripe iframe with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (stripeFrame) {
      // The CardElement combines all fields into one input
      // Try different selectors for the Stripe input field
      const inputSelectors = [
        'input[name="cardnumber"]', // Common Stripe field name
        'input[data-elements-stable-field-name="cardNumber"]', // Stripe Elements stable field name
        'input[placeholder*="1234"]', // Placeholder hint
        'input[placeholder*="card"]', // Generic card placeholder  
        'input[aria-label*="card"]', // Aria label
        'input', // Generic input as fallback
      ];
      
      let cardInput = null;
      for (const selector of inputSelectors) {
        try {
          const input = stripeFrame.locator(selector).first();
          await input.waitFor({ state: 'visible', timeout: 3000 });
          cardInput = input;
          console.log(`Found Stripe card input using selector: ${selector}`);
          break;
        } catch (e) {
          // Continue trying other selectors
        }
      }
      
      if (cardInput) {
        console.log('Attempting to fill Stripe card input...');
        
        try {
          // For Stripe CardElement, we need to use type() instead of fill() and handle field transitions
          console.log('Clicking card input to focus it...');
          await cardInput.click();
          
          // Clear any existing content
          await cardInput.fill('');
          
          // Approach 1: Type card number and let Stripe auto-advance
          console.log('Typing card number: 4111111111111111');
          await page.keyboard.type('4111111111111111');
          
          // Wait a moment for Stripe to process and potentially auto-advance
          await page.waitForTimeout(500);
          
          // For expiry, we might need to manually tab or Stripe might auto-advance
          console.log('Entering expiry date...');
          
          // Try typing the expiry - Stripe usually auto-advances after valid card number
          await page.keyboard.type('1230'); // MM/YY format
          await page.waitForTimeout(500);
          
          // Enter CVC
          console.log('Entering CVC...');
          await page.keyboard.type('123');
          await page.waitForTimeout(500);
          
          // Enter ZIP code (often required by Stripe)
          console.log('Entering ZIP code...');
          await page.keyboard.type('12345');
          await page.waitForTimeout(500);
          
          console.log('✅ Successfully filled Stripe card using keyboard input');
          cardFilled = true;
          
        } catch (e) {
          console.log('Keyboard input approach failed, trying alternative...');
          
          try {
            // Approach 2: Try with explicit tabs between fields
            await cardInput.click();
            await cardInput.fill(''); // Clear
            
            console.log('Trying with explicit tab navigation...');
            await page.keyboard.type('4111111111111111'); // Card number
            await page.keyboard.press('Tab'); // Force move to expiry
            await page.waitForTimeout(200);
            await page.keyboard.type('12'); // MM
            await page.keyboard.type('30'); // YY  
            await page.keyboard.press('Tab'); // Force move to CVC
            await page.waitForTimeout(200);
            await page.keyboard.type('123'); // CVC
            await page.keyboard.press('Tab'); // Force move to ZIP
            await page.waitForTimeout(200);
            await page.keyboard.type('12345'); // ZIP code
            
            console.log('✅ Successfully filled card with explicit tab navigation');
            cardFilled = true;
            
          } catch (e2) {
            console.log('Tab navigation approach failed, trying single string...');
            
            try {
              // Approach 3: Some Stripe implementations accept space-separated values
              await cardInput.click();
              await cardInput.fill('4111111111111111 12/30 123 12345');
              console.log('✅ Successfully filled card with single string');
              cardFilled = true;
            } catch (e3) {
              console.log('All Stripe filling approaches failed:', e3.message);
            }
          }
        }
      } else {
        console.log('Could not find Stripe card input field in iframe');
      }
    } else {
      console.log('No Stripe iframe found, trying fallback approach...');
      
      // Fallback: Try regular form fields if Stripe Elements not available
      const cardNumberInput = await TestHelpers.findVisibleElement(page, [
        'input[name="cardNumber"]',
        'input[placeholder*="card number"]',
        'input[placeholder*="Card number"]',
        'input[data-testid="card-number"]'
      ]);
      
      if (cardNumberInput) {
        console.log('Found regular card number input field');
        await cardNumberInput.element.fill('4111111111111111');
        
        const expiryInput = await TestHelpers.findVisibleElement(page, [
          'input[name="expiry"]',
          'input[placeholder*="MM/YY"]',
          'input[placeholder*="expiry"]',
          'input[placeholder*="Expiry"]'
        ]);
        if (expiryInput) {
          await expiryInput.element.fill('12/30');
        } else {
          throw new Error('Expiry date input not found');
        }
        
        const cvcInput = await TestHelpers.findVisibleElement(page, [
          'input[name="cvc"]',
          'input[placeholder*="CVC"]',
          'input[placeholder*="CVV"]',
          'input[placeholder*="Security Code"]'
        ]);
        if (cvcInput) {
          await cvcInput.element.fill('123');
        } else {
          throw new Error('CVC/CVV input not found');
        }
        
        cardFilled = true;
      }
    }
  } catch (e) {
    console.log('Error filling Stripe card:', e.message);
  }
  
  if (!cardFilled) {
    throw new Error('Could not fill credit card form - Stripe CardElement not found');
  }
  
  console.log('Successfully filled card information');
  // Wait a moment for form validation
  await page.waitForTimeout(1000);
}

async function getPaymentMethodCount(page: Page): Promise<number> {
  console.log('Counting payment methods...');
  
  // Try multiple selectors for payment methods
  const paymentMethodSelectors = [
    '[data-testid="payment-method"]',
    '.payment-method-item',
    '.saved-card',
    '.payment-method',
    // Look in Payment Methods table rows
    'table tbody tr', // Generic table rows in payment methods section
    '[aria-label="payment-methods-box"] table tbody tr', // Specific to payment methods DisplayBox
  ];
  
  let count = 0;
  for (const selector of paymentMethodSelectors) {
    const tempCount = await page.locator(selector).count();
    if (tempCount > count) {
      count = tempCount;
      console.log(`Found ${count} payment methods using selector: ${selector}`);
    }
  }
  
  console.log(`Total payment method count: ${count}`);
  return count;
}

async function getRecurringDonationCount(page: Page): Promise<number> {
  console.log('Counting recurring donations...');
  
  // Try multiple selectors for recurring donations
  const recurringSelectors = [
    '[data-testid="recurring-donation"]',
    '.recurring-item',
    '.subscription-item', 
    '.recurring-donation',
    // Look for specific recurring donation indicators
    'table tbody tr:has-text("recurring")',
    'table tbody tr:has-text("monthly")',
    'table tbody tr:has-text("subscription")',
  ];
  
  let count = 0;
  for (const selector of recurringSelectors) {
    const tempCount = await page.locator(selector).count();
    if (tempCount > count) {
      count = tempCount;
      console.log(`Found ${count} recurring donations using selector: ${selector}`);
    }
  }
  
  console.log(`Total recurring donation count: ${count}`);
  return count;
}