import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, "tests", ".auth-state.json");

// Windows doesn't resolve *.localhost; use localtest.me instead
const baseURL = process.env.BASE_URL || "http://grace.localtest.me:3301";
const appPort = new URL(baseURL).port || "3301";
const apiBase = process.env.API_BASE || "http://localhost:8084";
const lessonsApiBase = process.env.LESSONS_API_BASE || "http://localhost:8090";
const messagingSocket = process.env.NEXT_PUBLIC_MESSAGING_API_SOCKET || "ws://localhost:8087";
// Tests run against a production build (`next build` + `next start`). The dev server renders every page in one
// process with dev-mode React and compiles routes on first hit, so workers queued on it: 4 workers were no
// faster than 2 and three times as flaky. The build sets PW_NO_ISR so cached pages and fetches are never
// served stale (see next.config.mjs). Set PW_DEV_SERVER=1 to debug against `next dev`; only then is a server
// already on the port reused, so a dev server left running by the demo stack fails the run loudly instead of
// silently slowing it down.
const useDevServer = !!process.env.PW_DEV_SERVER;

export default defineConfig({
  testDir: "./tests",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Four workers on a 4-core box; the production server handles them in parallel.
  workers: 4,
  reporter: "list",
  timeout: 90 * 1000,
  expect: { timeout: 10 * 1000 },

  globalSetup: "./tests/global-setup.ts",

  use: {
    baseURL,
    storageState: STORAGE_STATE_PATH,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Video is off: recording every test cost about a core of ffmpeg; screenshots are what failure triage reads.
    video: "off",
    actionTimeout: 15 * 1000,
    navigationTimeout: 60 * 1000,
    // Block Serwist from serving stale /mobile/* cache during tests
    serviceWorkers: "block"
  },

  webServer: [
    {
      command: "npm --prefix ../Api run dev",
      url: `${apiBase}/health`,
      reuseExistingServer: true,
      timeout: 60 * 1000,
      stdout: "pipe",
      stderr: "pipe"
    },
    {
      command: "npm --prefix ../LessonsApi run dev",
      url: `${lessonsApiBase}/health`,
      reuseExistingServer: true,
      timeout: 90 * 1000,
      stdout: "pipe",
      stderr: "pipe"
    },
    {
      // Force dev so EnvironmentHelper uses localhost API URLs from .env
      command: useDevServer ? `npm run dev -- -p ${appPort}` : `npm run build && npm run start -- -p ${appPort}`,
      env: {
        ...(useDevServer ? {} : { PW_NO_ISR: "1" }),
        NEXT_PUBLIC_STAGE: "dev",
        NEXT_PUBLIC_API_BASE: apiBase,
        NEXT_PUBLIC_LESSONS_API: lessonsApiBase,
        // Localhost socket for consolidated subscription stack and cross-user realtime tests
        NEXT_PUBLIC_MESSAGING_API_SOCKET: messagingSocket
      },
      url: `http://localhost:${appPort}`,
      reuseExistingServer: useDevServer,
      timeout: (useDevServer ? 120 : 600) * 1000
    }
  ],

  projects: [
    {
      // Use test.describe.serial(...) for dependent test chains.
      // hide-public-site turns the church site off for the whole file; keep it out of this project.
      name: "chromium",
      testIgnore: /hide-public-site\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        headless: true
      },
      fullyParallel: true
    },
    {
      // Runs after the other specs so a hidden public site cannot blank their pages or sitemap.
      name: "hidden-site",
      dependencies: ["chromium"],
      testMatch: /hide-public-site\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        headless: true
      }
    }
  ]
});
