import { chromium, type FullConfig } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
// @ts-expect-error - plain ESM JS module, no .d.ts
import { verifyEnv } from "./setup/verify-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, ".auth-state.json");

/** Log in once as demo@b1.church and save browser storage state for test worker reuse; church determined by subdomain (no dialog). */
async function globalSetup(config: FullConfig) {
  await verifyEnv({ fullCheck: true });

  const baseURL = config.projects[0].use.baseURL || process.env.BASE_URL || "http://grace.localhost:3301";

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(baseURL + "/login", { timeout: 60000 });

  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 30000 });

  await page.fill('input[type="email"]', "demo@b1.church");
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');

  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 60000 });

  // Avoid Next.js dev first-compile penalty blocking all workers simultaneously.
  for (const path of ["/", "/sermons", "/mobile/dashboard", "/mobile/groups", "/mobile/community"]) {
    await page.goto(baseURL + path, { timeout: 60000 }).catch(() => { /* warm-up — ignore failures */ });
  }

  await context.storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}

export default globalSetup;
export { STORAGE_STATE_PATH };
