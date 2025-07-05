import { expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-base';

export class AdminStylesTests {

  static async testStylesNavigation(page) {
    console.log('Testing styles navigation and main interface...');
    
    await TestHelpers.clearBrowserState(page);
    await TestHelpers.login(page);
    
    // Navigate to styles page
    await page.goto('/admin/site/styles');
    
    // Wait for main page to load
    await expect(page.getByText('Manage Global Styles')).toBeVisible({ timeout: 10000 });
    
    // Check if Style Settings menu is visible
    await expect(page.getByText('Style Settings')).toBeVisible();
    
    // Verify all navigation links are present using proper anchor selectors
    await expect(page.locator('a:has-text("Color Palette")')).toBeVisible();
    await expect(page.locator('a:has-text("Fonts")')).toBeVisible();
    await expect(page.locator('a:has-text("CSS and Javascript")')).toBeVisible();
    await expect(page.locator('a:has-text("Logo")')).toBeVisible();
    await expect(page.locator('a:has-text("Site Footer")')).toBeVisible();
    
    // Check if icons are present for each link using Material-UI icon text content
    await expect(page.getByText('palette')).toBeVisible();
    await expect(page.getByText('text_fields')).toBeVisible();
    await expect(page.getByText('css')).toBeVisible();
    await expect(page.getByText('image')).toBeVisible();
    await expect(page.getByText('smart_button')).toBeVisible();
    
    console.log('✓ Styles navigation test completed successfully');
  }

  static async testColorPaletteEditor(page) {
    console.log('Testing color palette editor functionality...');
    
    await TestHelpers.clearBrowserState(page);
    await TestHelpers.login(page);
    await page.goto('/admin/site/styles');
    await page.waitForTimeout(2000);
    
    // Click on Color Palette link
    await page.click('a:has-text("Color Palette")');
    
    // Wait for palette editor to load
    await expect(page.getByText('Edit Color Palette')).toBeVisible({ timeout: 10000 });
    
    // Check if color input fields are present
    await expect(page.locator('input[type="color"][name="light"]')).toBeVisible();
    await expect(page.locator('input[type="color"][name="lightAccent"]')).toBeVisible();
    await expect(page.locator('input[type="color"][name="accent"]')).toBeVisible();
    await expect(page.locator('input[type="color"][name="darkAccent"]')).toBeVisible();
    await expect(page.locator('input[type="color"][name="dark"]')).toBeVisible();
    
    // Test changing a color value
    const accentInput = page.locator('input[type="color"][name="accent"]');
    await accentInput.fill('#ff0000');
    
    // Check that suggested palettes section is visible
    await expect(page.getByText('Suggested Pallets')).toBeVisible();
    
    // Check that pairings section is visible
    await expect(page.getByText('Pairings')).toBeVisible();
    
    // Test cancel functionality
    await page.click('button:has-text("CANCEL")');
    
    console.log('✓ Color palette editor test completed successfully');
  }

  static async testFontEditor(page) {
    console.log('Testing font editor functionality...');
    
    await TestHelpers.clearBrowserState(page);
    await TestHelpers.login(page);
    await page.goto('/admin/site/styles');
    await page.waitForTimeout(2000);
    
    // Click on Fonts link
    await page.click('a:has-text("Fonts")');
    
    // Wait for fonts editor to load
    await expect(page.getByText('Heading Font')).toBeVisible({ timeout: 10000 });
    
    // Check if font selection buttons are present
    await expect(page.getByText('Body Font')).toBeVisible();
    
    // Check if font buttons are clickable - look for any button in the font section
    const fontButtons = page.locator('button');
    const buttonCount = await fontButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Check if preview text is visible
    await expect(page.getByText('Heading Preview')).toBeVisible();
    await expect(page.getByText('Lorem ipsum')).toBeVisible();
    
    // Check if sample pairings section is visible
    await expect(page.getByText('Sample Pairings')).toBeVisible();
    
    // Test cancel functionality
    await page.click('button:has-text("CANCEL")');
    
    console.log('✓ Font editor test completed successfully');
  }

  static async testCssEditor(page) {
    console.log('Testing CSS and Javascript editor functionality...');
    
    await TestHelpers.clearBrowserState(page);
    await TestHelpers.login(page);
    await page.goto('/admin/site/styles');
    await page.waitForTimeout(2000);
    
    // Click on CSS and Javascript link
    await page.click('a:has-text("CSS and Javascript")');
    
    // Wait for CSS editor to load - use first occurrence to avoid strict mode violation
    await expect(page.getByText('Custom CSS').first()).toBeVisible({ timeout: 10000 });
    
    // Check if CSS textarea is present
    const cssTextarea = page.locator('textarea[name="css"]');
    await expect(cssTextarea).toBeVisible();
    
    // Test adding some CSS
    await cssTextarea.fill('body { background-color: #f0f0f0; }');
    
    // Check if JavaScript textarea is present
    const jsTextarea = page.locator('textarea[name="js"]');
    await expect(jsTextarea).toBeVisible();
    
    // Test adding some JS
    await jsTextarea.fill('console.log("Test JS");');
    
    // Test cancel functionality
    await page.click('button:has-text("CANCEL")');
    
    console.log('✓ CSS and Javascript editor test completed successfully');
  }

  static async testLogoSection(page) {
    console.log('Testing logo section functionality...');
    
    await TestHelpers.clearBrowserState(page);
    await TestHelpers.login(page);
    await page.goto('/admin/site/styles');
    await page.waitForTimeout(2000);
    
    // Click on Logo link
    await page.click('a:has-text("Logo")');
    
    // Wait for logo section to load - check for common logo-related text
    await page.waitForTimeout(2000);
    
    // Look for file upload or logo-related elements using getByText
    const logoText = page.getByText('logo', { exact: false });
    const logoFileInput = page.locator('input[type="file"]');
    const logoContent = await logoText.count() + await logoFileInput.count();
    
    if (logoContent > 0) {
      console.log('✓ Logo section loaded with upload elements');
    }
    
    // Try to go back to main styles view
    if (await page.locator('button:has-text("CANCEL")').isVisible()) {
      await page.click('button:has-text("CANCEL")');
    } else {
      // Navigate back to styles main page
      await page.goto('/admin/site/styles');
    }
    
    console.log('✓ Logo section test completed successfully');
  }

  static async testSiteFooter(page) {
    console.log('Testing site footer functionality...');
    
    await TestHelpers.clearBrowserState(page);
    await TestHelpers.login(page);
    await page.goto('/admin/site/styles');
    await page.waitForTimeout(2000);
    
    // Click on Site Footer link
    await page.click('a:has-text("Site Footer")');
    
    // Wait for navigation or footer editor to load
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to block editor or if footer content loads
    const currentUrl = page.url();
    if (currentUrl.includes('/blocks/')) {
      console.log('✓ Successfully navigated to footer block editor');
      // Navigate back to styles page for next test
      await page.goBack();
    } else {
      // Look for footer-related content
      const footerContent = await page.getByText('footer', { exact: false }).count();
      if (footerContent > 0) {
        console.log('✓ Footer section loaded');
      }
    }
    
    console.log('✓ Site footer test completed successfully');
  }

  static async testSaveColorPalette(page) {
    console.log('Testing color palette save functionality...');
    
    await TestHelpers.clearBrowserState(page);
    await TestHelpers.login(page);
    await page.goto('/admin/site/styles');
    await page.waitForTimeout(2000);
    
    // Click on Color Palette link
    await page.click('a:has-text("Color Palette")');
    
    // Wait for palette editor to load
    await expect(page.getByText('Edit Color Palette')).toBeVisible({ timeout: 10000 });
    
    // Change accent color
    const accentInput = page.locator('input[type="color"][name="accent"]');
    await accentInput.fill('#00ff00');
    
    // Click save button
    await page.click('button:has-text("SAVE")');
    
    // Wait for save to complete and return to main view
    await page.waitForTimeout(2000);
    
    // Verify we're back to main styles page
    await expect(page.getByText('Style Settings')).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Color palette save test completed successfully');
  }

  static async testSuggestedPaletteSelection(page) {
    console.log('Testing suggested palette selection...');
    
    await TestHelpers.clearBrowserState(page);
    await TestHelpers.login(page);
    await page.goto('/admin/site/styles');
    await page.waitForTimeout(2000);
    
    // Click on Color Palette link
    await page.click('a:has-text("Color Palette")');
    
    // Wait for palette editor to load
    await expect(page.getByText('Edit Color Palette')).toBeVisible({ timeout: 10000 });
    
    // Wait for suggested palettes to load
    await expect(page.getByText('Suggested Pallets')).toBeVisible();
    
    // Click on the first suggested palette
    const firstPalette = page.locator('table').nth(1); // First palette table after the color inputs
    if (await firstPalette.isVisible()) {
      await firstPalette.click();
      console.log('✓ Clicked on suggested palette');
    }
    
    // Test cancel to avoid saving changes
    await page.click('button:has-text("CANCEL")');
    
    console.log('✓ Suggested palette selection test completed successfully');
  }
}