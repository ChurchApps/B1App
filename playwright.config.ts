import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, "tests", ".auth-state.json");

// Windows doesn't resolve *.localhost; use localtest.me instead
const baseURL = process.env.BASE_URL || "http://grace.localtest.me:3301";

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Next.js dev compiles routes on first hit; limit workers to avoid cold-start overwhelm
  workers: 2,
  reporter: "list",
  timeout: 90 * 1000,
  expect: { timeout: 10 * 1000 },

  globalSetup: "./tests/global-setup.ts",

  use: {
    baseURL,
    storageState: STORAGE_STATE_PATH,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15 * 1000,
    navigationTimeout: 60 * 1000,
    // Block Serwist from serving stale /mobile/* cache during tests
    serviceWorkers: "block"
  },

  webServer: [
    {
      command: "npm --prefix ../Api run dev",
      url: "http://localhost:8084/health",
      reuseExistingServer: true,
      timeout: 60 * 1000,
      stdout: "pipe",
      stderr: "pipe"
    },
    {
      // Force dev so EnvironmentHelper uses localhost API URLs from .env
      command: "npm run dev",
      env: {
        NEXT_PUBLIC_STAGE: "dev",
        // Localhost socket for consolidated subscription stack and cross-user realtime tests
        NEXT_PUBLIC_MESSAGING_API_SOCKET: "ws://localhost:8087",
        NEXT_PUBLIC_ENABLE_NOTIFICATION_SOCKET: "true"
      },
      url: "http://localhost:3301",
      reuseExistingServer: true,
      timeout: 120 * 1000
    }
  ],

  projects: [
    {
      // Use test.describe.serial(...) for dependent test chains
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: true
      },
      fullyParallel: true
    }
  ]
});
