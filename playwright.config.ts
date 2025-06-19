import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: 'list',
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },

  use: {
    baseURL: 'https://grace.demo.b1.church',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10 * 1000,
    navigationTimeout: 20 * 1000,
    // Clear all browser state between tests
    storageState: undefined,
    // Disable service workers which can cache data
    serviceWorkers: 'block',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security'
        ],
        // Browser context options
        contextOptions: {
          // Disable cache
          bypassCSP: true,
          ignoreHTTPSErrors: true,
        }
      },
    },
  ],
});