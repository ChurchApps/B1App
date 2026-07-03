import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { waitForAlertsJoin } from "./helpers/realtime";

/** Tests cross-user realtime PM delivery via SubscriptionManager broadcast; uses two fresh contexts for isolated auth. */

const DEMO_PERSON_ID = "PER00000082";
const TESTER_PERSON_ID = "PER00000083";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login", { timeout: 60000 });
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

async function openThreadTo(page: Page, otherPersonId: string) {
  await page.goto(`/mobile/messages/${otherPersonId}`, { timeout: 60000 });
  const composer = page.getByPlaceholder(/Type (a|your) message/i).first();
  await composer.waitFor({ state: "visible", timeout: 30000 });
  return composer;
}

async function send(page: Page, content: string) {
  const composer = page.getByPlaceholder(/Type (a|your) message/i).first();
  await composer.fill(content);
  await composer.press("Enter");
}

test.describe("Realtime — cross-user private messages", () => {
  test.describe.configure({ mode: "serial" });

  let demoContext: BrowserContext;
  let testerContext: BrowserContext;
  let demoPage: Page;
  let testerPage: Page;

  test.beforeAll(async ({ browser }) => {
    demoContext = await browser.newContext({ storageState: undefined });
    testerContext = await browser.newContext({ storageState: undefined });
    demoPage = await demoContext.newPage();
    testerPage = await testerContext.newPage();

    await Promise.all([
      loginAs(demoPage, "demo@b1.church", "password"),
      loginAs(testerPage, "tester@b1.church", "password")
    ]);
  });

  test.afterAll(async () => {
    await demoContext?.close();
    await testerContext?.close();
  });

  test("demo -> tester message appears live without reload", async () => {
    const demoAlertsJoined = waitForAlertsJoin(demoPage);
    const testerAlertsJoined = waitForAlertsJoin(testerPage);

    await openThreadTo(demoPage, TESTER_PERSON_ID);
    await openThreadTo(testerPage, DEMO_PERSON_ID);

    await Promise.all([demoAlertsJoined, testerAlertsJoined]);

    const stamp = `from-demo-${Date.now()}`;
    await send(demoPage, stamp);

    await expect(testerPage.locator("body")).toContainText(stamp, { timeout: 15000 });
    await expect(demoPage.locator("body")).toContainText(stamp, { timeout: 15000 });
  });

  test("tester -> demo reply appears live without reload", async () => {
    const stamp = `from-tester-${Date.now()}`;
    await send(testerPage, stamp);

    await expect(demoPage.locator("body")).toContainText(stamp, { timeout: 15000 });
    await expect(testerPage.locator("body")).toContainText(stamp, { timeout: 15000 });
  });
});
