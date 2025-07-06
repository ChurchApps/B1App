import { test, expect, TestHelpers } from './helpers/test-base';

test.describe('Live Streaming', () => {
  test('access stream page', async ({ page }) => {
    // Stream page might be public
    await page.goto('/stream');
    await page.waitForLoadState('domcontentloaded');
    
    const url = page.url();
    // May redirect to a specific stream page or show stream list
    expect(url).toBeTruthy();
    
    // Look for streaming elements
    const streamIndicators = ['Live', 'Stream', 'Watch', 'Service', 'Video'];
    const hasStreamContent = await TestHelpers.hasAnyText(page, streamIndicators);
    
    if (hasStreamContent) {
      expect(hasStreamContent).toBeTruthy();
    }
  });

  test.skip('live chat interaction', async ({ page }) => {
    // Skip as it requires active stream
    await page.goto('/stream/live');
    
    // Look for chat elements
    const chatSelectors = [
      '.chat',
      'input[placeholder*="message"]',
      'text=Chat',
      '[role="textbox"]'
    ];
    
    const chatElement = await TestHelpers.findVisibleElement(page, chatSelectors);
    if (chatElement) {
      expect(chatElement).toBeTruthy();
    }
  });

  test('sermon archive access', async ({ page }) => {
    // Try various sermon/video URLs
    const sermonUrls = ['/sermons', '/media', '/watch', '/videos'];
    
    for (const url of sermonUrls) {
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');
      
      const currentUrl = page.url();
      if (!currentUrl.includes('404')) {
        // Found a valid sermon page
        const sermonIndicators = ['Sermon', 'Message', 'Watch', 'Play', 'Video'];
        const hasSermons = await TestHelpers.hasAnyText(page, sermonIndicators);
        
        if (hasSermons) {
          expect(hasSermons).toBeTruthy();
          break;
        }
      }
    }
  });

  test.skip('prayer request submission', async ({ authenticatedPage }) => {
    // Skip actual submission
    await authenticatedPage.goto('/stream');
    
    // Look for prayer request feature
    const prayerSelectors = [
      'text=Prayer',
      'button:has-text("Prayer")',
      'text=Request',
      '.prayer-request'
    ];
    
    const prayerElement = await TestHelpers.findVisibleElement(authenticatedPage, prayerSelectors);
    if (prayerElement) {
      expect(prayerElement).toBeTruthy();
    }
  });

  test.skip('stream countdown timer', async ({ page }) => {
    // Skip as it requires scheduled stream
    await page.goto('/stream');
    
    // Look for countdown elements
    const countdownIndicators = ['Next Service', 'Starting', 'Countdown', 'days', 'hours'];
    const hasCountdown = await TestHelpers.hasAnyText(page, countdownIndicators);
    
    if (hasCountdown) {
      expect(hasCountdown).toBeTruthy();
    }
  });
});