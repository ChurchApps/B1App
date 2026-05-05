import { test, expect, type BrowserContext, type Page } from "@playwright/test";

/**
 * End-to-end cross-user realtime test for the consolidated PM stack.
 *
 * Two real users in Grace Community Church:
 *   - demo@b1.church  (PER00000082)
 *   - tester@b1.church (PER00000083, Jane User; seeded for this scenario)
 *
 * Demo opens a thread to Jane and sends a message. Without reloading, Jane's tab
 * (already on her side of the same thread) should reflect the new message via the
 * SubscriptionManager + ConversationStore path. Jane replies; Demo's tab should
 * receive that reply the same way.
 *
 * This spec uses two fresh browser contexts (NOT the shared storageState) so each
 * user has their own auth + their own WebSocket.
 */

const DEMO_PERSON_ID = "PER00000082";   // demo@b1.church
const TESTER_PERSON_ID = "PER00000083"; // tester@b1.church (Jane User)

async function loginAs(page: Page, email: string, password: string) {
  // B1App uses subdomain-based church resolution; storageState is bypassed by the
  // calling test's newContext({ storageState: undefined }).
  await page.goto("/login", { timeout: 60000 });
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // After successful login, the user is redirected away from /login. SelectChurchModal
  // does not appear here because B1App resolves the church from the subdomain.
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

async function openThreadTo(page: Page, otherPersonId: string) {
  await page.goto(`/mobile/messages/${otherPersonId}`, { timeout: 60000 });
  // Wait for the composer to be ready — its presence implies the thread component
  // has resolved the conversationId (or is ready to create one on first send).
  const composer = page.getByPlaceholder(/Type (a|your) message/i).first();
  await composer.waitFor({ state: "visible", timeout: 30000 });
  return composer;
}

async function send(page: Page, content: string) {
  const composer = page.getByPlaceholder(/Type (a|your) message/i).first();
  await composer.fill(content);
  // Enter triggers handleSend per MessageConversation.tsx:476
  await composer.press("Enter");
}

test.describe("Realtime — cross-user private messages", () => {
  test.describe.configure({ mode: "serial" });

  let demoContext: BrowserContext;
  let testerContext: BrowserContext;
  let demoPage: Page;
  let testerPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Each user gets a fresh context — NOT the shared demo storageState.
    demoContext = await browser.newContext({ storageState: undefined });
    testerContext = await browser.newContext({ storageState: undefined });
    demoPage = await demoContext.newPage();
    testerPage = await testerContext.newPage();

    await Promise.all([
      loginAs(demoPage, "demo@b1.church", "password"),
      loginAs(testerPage, "tester@b1.church", "password"),
    ]);
  });

  test.afterAll(async () => {
    await demoContext?.close();
    await testerContext?.close();
  });

  test("demo -> tester message appears live without reload", async () => {
    // Both users open the thread between them.
    await openThreadTo(demoPage, TESTER_PERSON_ID);
    await openThreadTo(testerPage, DEMO_PERSON_ID);

    // Give each tab a moment to open its socket and join the conversation room.
    await demoPage.waitForTimeout(1500);
    await testerPage.waitForTimeout(1500);

    const stamp = `from-demo-${Date.now()}`;
    await send(demoPage, stamp);

    // Tester's open thread should reflect the message via the broadcast — no reload.
    await expect(testerPage.locator("body")).toContainText(stamp, { timeout: 15000 });
    // And demo's own tab should also show it (self-echo via the same broadcast).
    await expect(demoPage.locator("body")).toContainText(stamp, { timeout: 15000 });
  });

  test("tester -> demo reply appears live without reload", async () => {
    const stamp = `from-tester-${Date.now()}`;
    await send(testerPage, stamp);

    await expect(demoPage.locator("body")).toContainText(stamp, { timeout: 15000 });
    await expect(testerPage.locator("body")).toContainText(stamp, { timeout: 15000 });
  });
});
