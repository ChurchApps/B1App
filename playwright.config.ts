import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, 'tests', '.auth-state.json');

// B1App resolves [sdSlug] from the host header via next.config.mjs rewrites,
// so the demo church is reached via the `grace` subdomain. Windows does not
// resolve *.localhost by default, so use localtest.me (a stable public DNS
// service whose every subdomain resolves to 127.0.0.1 on every platform).
const baseURL = process.env.BASE_URL || 'http://grace.localtest.me:3301';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Next.js dev compiles routes on first hit; too many parallel workers
  // overwhelm it on first run. Keep concurrency modest.
  workers: process.env.CI ? 2 : 4,
  reporter: 'list',
  timeout: 90 * 1000,
  expect: { timeout: 10 * 1000 },

  globalSetup: './tests/global-setup.ts',

  use: {
    baseURL,
    storageState: STORAGE_STATE_PATH,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15 * 1000,
    navigationTimeout: 60 * 1000,
    // Block service workers — Serwist caches /mobile/* in prod and would
    // serve stale content during tests.
    serviceWorkers: 'block',
  },

  webServer: [
    {
      command: 'npm --prefix ../Api run dev',
      url: 'http://localhost:8084/health',
      reuseExistingServer: true,
      timeout: 60 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Force NEXT_PUBLIC_STAGE=dev so EnvironmentHelper reads the
      // localhost API URLs from .env instead of pinning to prod URLs.
      command: 'npm run dev',
      env: { NEXT_PUBLIC_STAGE: 'dev' },
      url: 'http://localhost:3301',
      reuseExistingServer: true,
      timeout: 120 * 1000,
    },
  ],

  projects: [
    {
      // Files run in parallel across workers. Chains of dependent tests
      // (create→edit→delete of the same entity) wrap in test.describe.serial(...).
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
      fullyParallel: true,
    },
  ],
});
