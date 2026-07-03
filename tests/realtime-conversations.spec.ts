import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { waitForRoomJoin } from "./helpers/realtime";

/** Tests realtime group conversations via SubscriptionManager + ConversationStore broadcast. */

const GROUP_ID = "GRP00000004";

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login", { timeout: 60000 });
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

async function openGroupMessages(page: Page) {
  await page.goto(`/mobile/groups/${GROUP_ID}`, { timeout: 60000 });
  const messagesTab = page.getByRole("tab", { name: /Messages/i });
  await messagesTab.waitFor({ state: "visible", timeout: 30000 });
  await messagesTab.click();
  const composer = page.getByPlaceholder(/Send a message|message|Post/i).first();
  await composer.waitFor({ state: "visible", timeout: 15000 });
  return composer;
}

async function send(page: Page, content: string) {
  const composer = page.getByPlaceholder(/Send a message|message|Post/i).first();
  await composer.fill(content);
  await composer.press("Enter");
}

test.describe("Realtime — cross-user group conversations", () => {
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

    const demoJoined = waitForRoomJoin(demoPage);
    const testerJoined = waitForRoomJoin(testerPage);

    await Promise.all([
      openGroupMessages(demoPage),
      openGroupMessages(testerPage)
    ]);

    await Promise.all([demoJoined, testerJoined]);
  });

  test.afterAll(async () => {
    await demoContext?.close();
    await testerContext?.close();
  });

  test("demo posts -> tester sees it without reload", async () => {
    const stamp = `group-from-demo-${Date.now()}`;
    await send(demoPage, stamp);

    await expect(testerPage.locator("body")).toContainText(stamp, { timeout: 15000 });
    await expect(demoPage.locator("body")).toContainText(stamp, { timeout: 15000 });
  });

  test("tester replies -> demo sees it without reload", async () => {
    const stamp = `group-from-tester-${Date.now()}`;
    await send(testerPage, stamp);

    await expect(demoPage.locator("body")).toContainText(stamp, { timeout: 15000 });
    await expect(testerPage.locator("body")).toContainText(stamp, { timeout: 15000 });
  });
});
