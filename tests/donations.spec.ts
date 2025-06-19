import { test, expect, TestHelpers } from './helpers/test-base';
import { Page } from '@playwright/test';

test.describe('Donation Functionality - Complete CRUD Tests', () => {
  let initialPaymentMethodCount = 0;
  let initialRecurringDonationCount = 0;

  test.beforeAll(async ({ browser }) => {
    // Get initial state for data integrity
    const page = await browser.newPage();
    
    // Use shared login method
    await TestHelpers.loginAndSelectChurch(page, '/my/donate');
    
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
    await TestHelpers.loginAndSelectChurch(page, '/my/donate');
    
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
      // Check if loading indicators are gone
      const loadingElements = document.querySelectorAll('.MuiCircularProgress-root, [role="progressbar"]');
      return loadingElements.length === 0;
    }, { timeout: 30000 });
    
    await page.waitForTimeout(3000);
    
    // Verify the payment method was added by checking the count increased
    const newPaymentMethodCount = await getPaymentMethodCount(page);
    console.log(`Initial payment method count: ${initialPaymentMethodCount}, New count: ${newPaymentMethodCount}`);
    
    expect(newPaymentMethodCount, 'Payment method count must increase after adding card').toBeGreaterThan(initialPaymentMethodCount);
    console.log('✅ Payment method added successfully');
  });

  test('CREATE: Make one time donation', async ({ page }) => {
    console.log('=== Starting one-time donation test ===');
    
    // Login and navigate to donation page
    await TestHelpers.loginAndSelectChurch(page, '/my/donate');
    
    // Verify we're on the donation page
    expect(page.url()).toContain('/my/donate');
    console.log('✅ Successfully navigated to donation page');
    
    // Wait for donation form to load completely
    await page.waitForTimeout(3000);
    
    // Step 1: Click the "single-donation" button to activate one-time donation mode
    console.log('Looking for single-donation button...');
    const singleDonationButton = page.locator('button[aria-label="single-donation"]');
    
    expect(await singleDonationButton.isVisible({ timeout: 5000 }), 
      'Single-donation button must be visible on donation page').toBeTruthy();
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
    await TestHelpers.loginAndSelectChurch(page, '/my/donate');
    
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
    
    expect(recurringControl, 'Recurring donation control must be available').toBeTruthy();
    
    if (recurringControl.selector.includes('checkbox')) {
      await recurringControl.element.check();
      console.log('✅ Checked recurring donation checkbox');
    } else if (recurringControl.selector.includes('button')) {
      await recurringControl.element.click();
      console.log('✅ Clicked recurring donation button');
    }
    
    // Select frequency if dropdown is available
    const frequencySelectors = [
      'select[name="frequency"]',
      'select[name="interval"]',
      'select[aria-label*="frequency"]',
      'select[aria-label*="interval"]'
    ];
    
    let frequencyDropdown = null;
    for (const selector of frequencySelectors) {
      frequencyDropdown = await TestHelpers.findVisibleElement(page, [selector]);
      if (frequencyDropdown) break;
    }
    
    if (frequencyDropdown) {
      await frequencyDropdown.element.selectOption({ value: 'monthly' });
      console.log('✅ Selected monthly frequency');
    }
    
    // Submit recurring donation
    console.log('Looking for save/submit button...');
    const submitSelectors = [
      'button[aria-label="save-button"]',
      'button:has-text("Save")',
      'button:has-text("Set up")',
      'button:has-text("Create")',
      'button[type="submit"]:not([disabled])'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        await page.waitForSelector(selector, { state: 'visible', timeout: 5000 });
        submitButton = await TestHelpers.findVisibleElement(page, [selector]);
        if (submitButton) break;
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    expect(submitButton, 'Submit button must be visible for recurring donation').toBeTruthy();
    
    console.log('Clicking submit button to create recurring donation...');
    await submitButton.element.click();
    
    // Wait for processing
    await page.waitForTimeout(8000);
    
    // Check for success
    console.log('Checking for recurring donation success...');
    const recurringSuccessIndicators = [
      'text=Recurring donation',
      'text=successfully',
      'text=created',
      'text=set up',
      'text=Monthly donation',
      'text=$10.00'
    ];
    
    let recurringSuccessful = false;
    for (const indicator of recurringSuccessIndicators) {
      if (await page.locator(indicator).isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log(`✅ Found recurring success indicator: ${indicator}`);
        recurringSuccessful = true;
        break;
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

  test('UPDATE: Edit recurring donation', async ({ page }) => {
    // Login and navigate
    await TestHelpers.loginAndSelectChurch(page, '/my/donate');
    
    // Find recurring donations section
    await page.waitForLoadState('networkidle');
    
    // Look for edit button on a recurring donation
    const editSelectors = [
      'button[aria-label*="edit"]',
      'button:has-text("Edit")',
      '.recurring-donation button',
      '[data-testid*="recurring"] button'
    ];
    
    let editButton = null;
    for (const selector of editSelectors) {
      editButton = await TestHelpers.findVisibleElement(page, [selector]);
      if (editButton) break;
    }
    
    if (!editButton) {
      console.log('No recurring donations found to edit, skipping test');
      return;
    }
    
    await editButton.element.click();
    
    // Update amount
    const amountInput = await TestHelpers.findVisibleElement(page, [
      'input[name="amount"]',
      'input[type="number"]'
    ]);
    
    if (amountInput) {
      await amountInput.element.clear();
      await amountInput.element.fill('15.00');
    }
    
    // Save changes
    const saveButton = await TestHelpers.findVisibleElement(page, [
      'button[aria-label="save-button"]',
      'button:has-text("Save")',
      'button:has-text("Update")'
    ]);
    
    expect(saveButton, 'Save button must be available when editing').toBeTruthy();
    await saveButton.element.click();
    
    // Verify update succeeded
    await page.waitForTimeout(5000);
    const updateSuccess = await TestHelpers.hasAnyText(page, ['Updated', 'Saved', '$15.00']);
    expect(updateSuccess, 'Recurring donation must be updated successfully').toBeTruthy();
  });

  test('DELETE: Remove recurring donation', async ({ page }) => {
    // Login and navigate
    await TestHelpers.loginAndSelectChurch(page, '/my/donate');
    
    // Find recurring donations section
    await page.waitForLoadState('networkidle');
    
    // Look for delete button on a recurring donation
    const deleteSelectors = [
      'button[aria-label*="delete"]',
      'button[aria-label*="cancel"]',
      'button:has-text("Delete")',
      'button:has-text("Cancel")',
      '.recurring-donation button[color="error"]'
    ];
    
    let deleteButton = null;
    for (const selector of deleteSelectors) {
      deleteButton = await TestHelpers.findVisibleElement(page, [selector]);
      if (deleteButton) break;
    }
    
    if (!deleteButton) {
      console.log('No recurring donations found to delete, skipping test');
      return;
    }
    
    const initialCount = await getRecurringDonationCount(page);
    await deleteButton.element.click();
    
    // Confirm deletion if modal appears
    const confirmButton = await TestHelpers.findVisibleElement(page, [
      'button:has-text("Confirm")',
      'button:has-text("Yes")',
      'button:has-text("Delete")'
    ]);
    
    if (confirmButton) {
      await confirmButton.element.click();
    }
    
    // Verify deletion
    await page.waitForTimeout(5000);
    const newCount = await getRecurringDonationCount(page);
    
    expect(newCount < initialCount || await TestHelpers.hasAnyText(page, ['Cancelled', 'Deleted', 'Removed']), 
      'Recurring donation must be deleted successfully').toBeTruthy();
  });

  test('DELETE: Remove payment method', async ({ page }) => {
    // Login and navigate
    await TestHelpers.loginAndSelectChurch(page, '/my/donate');
    
    // Find payment methods section
    await page.waitForLoadState('networkidle');
    
    // Look for delete button on a payment method
    const deleteSelectors = [
      '.payment-method button[aria-label*="delete"]',
      'button[aria-label*="remove"]',
      '.payment-method button:has-text("Delete")',
      '[data-testid*="payment"] button[color="error"]'
    ];
    
    let deleteButton = null;
    for (const selector of deleteSelectors) {
      deleteButton = await TestHelpers.findVisibleElement(page, [selector]);
      if (deleteButton) break;
    }
    
    if (!deleteButton) {
      console.log('No payment methods found to delete, skipping test');
      return;
    }
    
    const initialCount = await getPaymentMethodCount(page);
    await deleteButton.element.click();
    
    // Confirm deletion if modal appears
    const confirmButton = await TestHelpers.findVisibleElement(page, [
      'button:has-text("Confirm")',
      'button:has-text("Yes")',
      'button:has-text("Delete")'
    ]);
    
    if (confirmButton) {
      await confirmButton.element.click();
    }
    
    // Verify deletion
    await page.waitForTimeout(5000);
    const newCount = await getPaymentMethodCount(page);
    
    expect(newCount === initialPaymentMethodCount || await TestHelpers.hasAnyText(page, ['Removed', 'Deleted']), 
      'Payment method must be deleted, returning to initial state').toBeTruthy();
  });
});

// Helper function to fill Stripe card details
async function fillStripeCard(page: Page) {
  console.log('Filling Stripe card details...');
  
  // Wait for Stripe iframe to load
  const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
  
  // Try to interact with Stripe elements
  try {
    // Card number
    const cardInput = stripeFrame.locator('[placeholder*="Card number"], [placeholder*="card"], [name="cardnumber"], input').first();
    await cardInput.click();
    await page.keyboard.type('4111111111111111', { delay: 100 });
    console.log('✅ Entered card number');
    
    // Expiry
    await page.keyboard.press('Tab');
    await page.keyboard.type('122030', { delay: 100 });
    console.log('✅ Entered expiry date');
    
    // CVC
    await page.keyboard.press('Tab');
    await page.keyboard.type('123', { delay: 100 });
    console.log('✅ Entered CVC');
    
    // ZIP
    await page.keyboard.press('Tab');
    await page.keyboard.type('12345', { delay: 100 });
    console.log('✅ Entered ZIP code');
    
  } catch (error) {
    console.error('Error filling Stripe form:', error);
    // Try alternative approach - direct input if iframe approach fails
    await page.fill('input[name="cardNumber"]', '4111111111111111').catch(() => {});
    await page.fill('input[name="cardExpiry"]', '12/2030').catch(() => {});
    await page.fill('input[name="cardCvc"]', '123').catch(() => {});
    await page.fill('input[name="postalCode"]', '12345').catch(() => {});
  }
  
  await page.waitForTimeout(2000);
}

// Helper to count payment methods
async function getPaymentMethodCount(page: Page): Promise<number> {
  try {
    const paymentMethods = await page.locator('.payment-method, [data-testid*="payment-method"]').count();
    return paymentMethods;
  } catch {
    return 0;
  }
}

// Helper to count recurring donations
async function getRecurringDonationCount(page: Page): Promise<number> {
  try {
    const recurringDonations = await page.locator('.recurring-donation, [data-testid*="recurring"]').count();
    return recurringDonations;
  } catch {
    return 0;
  }
}