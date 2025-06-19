import { test } from '@playwright/test';
import { AdminSiteTests } from './modules/admin-site';
import { AdminBlocksTests } from './modules/admin-blocks';

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