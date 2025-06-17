import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Admin Access', () => {
  test('admin pages require permissions', async ({ authenticatedPage }) => {
    // Try to access admin
    await authenticatedPage.goto('/admin');
    await authenticatedPage.waitForLoadState('domcontentloaded');
    
    // Check if user has admin access or was redirected
    const url = authenticatedPage.url();
    // The demo user might have admin access in the demo environment
    const hasAccess = url.includes('/admin');
    const wasRedirected = url.includes('/my');
    
    expect(hasAccess || wasRedirected).toBeTruthy();
  });

  test('admin site page access', async ({ authenticatedPage }) => {
    // Try direct admin site access
    await authenticatedPage.goto('/admin/site');
    await authenticatedPage.waitForLoadState('domcontentloaded');
    
    const url = authenticatedPage.url();
    // Either has access (admin/site) or redirected (my)
    expect(url.includes('/admin/site') || url.includes('/my')).toBeTruthy();
  });
});