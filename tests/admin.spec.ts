import { test } from '@playwright/test';
import { AdminSiteTests } from './modules/admin-site';
import { AdminBlocksTests } from './modules/admin-blocks';
import { AdminStylesTests } from './modules/admin-styles';
import { AdminVideoTests } from './modules/admin-video';

test.describe('Admin Site Management', () => {
  test('should create new test page', async ({ page }) => {
    await AdminSiteTests.createTestPage(page);
  });

  test('should edit test page content to Hello World', async ({ page }) => {
    await AdminSiteTests.editTestPageContent(page);
  });

  test('should add test page to main navigation', async ({ page }) => {
    await AdminSiteTests.addTestPageToNavigation(page);
  });

  test('should delete test content and restore original state', async ({ page }) => {
    await AdminSiteTests.deleteTestContentAndRestoreOriginalState(page);
  });
});

test.describe('Admin Blocks Management', () => {
  test('should create new test block', async ({ page }) => {
    await AdminBlocksTests.createTestBlock(page);
  });

  test('should edit test block content', async ({ page }) => {
    await AdminBlocksTests.editTestBlockContent(page);
  });

  test('should use test block in a page', async ({ page }) => {
    await AdminBlocksTests.useTestBlockInPage(page);
  });

  test('should delete test block and clean up test pages to restore original state', async ({ page }) => {
    await AdminBlocksTests.deleteTestBlockAndCleanup(page);
  });
});

test.describe('Admin Styles Management', () => {
  test('should navigate to styles page and show main interface', async ({ page }) => {
    await AdminStylesTests.testStylesNavigation(page);
  });

  test('should test color palette editor', async ({ page }) => {
    await AdminStylesTests.testColorPaletteEditor(page);
  });

  test('should test font editor', async ({ page }) => {
    await AdminStylesTests.testFontEditor(page);
  });

  test('should test CSS and Javascript editor', async ({ page }) => {
    await AdminStylesTests.testCssEditor(page);
  });

  test('should test logo section', async ({ page }) => {
    await AdminStylesTests.testLogoSection(page);
  });

  test('should test site footer functionality', async ({ page }) => {
    await AdminStylesTests.testSiteFooter(page);
  });

  test('should save color palette changes', async ({ page }) => {
    await AdminStylesTests.testSaveColorPalette(page);
  });

  test('should test suggested palette selection', async ({ page }) => {
    await AdminStylesTests.testSuggestedPaletteSelection(page);
  });
});

test.describe('Admin Video Management', () => {
  test('should create new test sermon', async ({ page }) => {
    await AdminVideoTests.createTestSermon(page);
  });

  test('should edit test sermon content', async ({ page }) => {
    await AdminVideoTests.editTestSermon(page);
  });

  test('should create new test playlist', async ({ page }) => {
    await AdminVideoTests.createTestPlaylist(page);
  });

  test('should access and test stream settings', async ({ page }) => {
    await AdminVideoTests.testStreamSettings(page);
  });

  test('should delete test content and restore original state', async ({ page }) => {
    await AdminVideoTests.deleteTestContentAndRestoreOriginalState(page);
  });
});