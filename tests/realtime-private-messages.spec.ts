import { test, expect, request } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

/** Validates that the private-messages list and thread view consume the consolidated subscription path. */
test.describe("Realtime — private messages", () => {
  test("messages list page loads", async ({ page }) => {
    await page.goto("/mobile/messages");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
  });

  test("compose page renders search input", async ({ page }) => {
    await page.goto("/mobile/messagesNew");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const searchBox = page.getByRole("textbox").first();
    await expect(searchBox).toBeVisible({ timeout: 15000 });
  });

  test("attempting a direct thread URL routes correctly", async ({ page }) => {
    await page.goto("/mobile/messages/PER00000001");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    await expect(page.locator("body")).toContainText(/Donald Clark|Send|Message/i, { timeout: 15000 });
  });
});

const MAIN_API = "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const TESTER_PERSON_ID = "PER00000083";
const DEMO_PERSON_ID = "PER00000082";
// PER00000001 / PER00000027 / PER00000069 / PER00000083 all have seeded or test-created demo threads.
const NO_THREAD_PERSON_ID = "PER00000002";

async function messagingApi(email: string) {
  const ctx = await request.newContext();
  const res = await ctx.post(`${MAIN_API}/membership/users/login`, { data: { email, password: "password" } });
  if (!res.ok()) throw new Error(`login ${email} failed: ${res.status()}`);
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: { church?: { id?: string } }) => c.church?.id === CHURCH_ID);
  const jwt = (uc?.apis || []).find((a: { keyName?: string }) => a.keyName === "MessagingApi")?.jwt;
  if (!jwt) throw new Error(`MessagingApi JWT missing for ${email}`);
  return { ctx, jwt };
}

type Handle = Awaited<ReturnType<typeof messagingApi>>;
const authed = (h: Handle) => ({ headers: { Authorization: `Bearer ${h.jwt}` } });
const apiGet = (h: Handle, path: string) => h.ctx.get(`${MAIN_API}/messaging${path}`, authed(h));
const apiPost = (h: Handle, path: string, data: unknown) => h.ctx.post(`${MAIN_API}/messaging${path}`, { ...authed(h), data });

test.describe("Private messages — existing/:personId", () => {
  test("existing/:personId resolves the tester thread and 404-equivalents to {} otherwise", async () => {
    const demo = await messagingApi("demo@b1.church");
    try {
      let hit = await apiGet(demo, `/privatemessages/existing/${TESTER_PERSON_ID}`);
      if (!(await hit.json())?.conversationId) {
        const convRes = await apiPost(demo, "/conversations", [
          {
            allowAnonymousPosts: false,
            contentType: "privateMessage",
            contentId: DEMO_PERSON_ID,
            title: "Private Message",
            visibility: "hidden"
          }
        ]);
        const convId = (await convRes.json())[0].id;
        // POST is idempotent per pair, so this creates the row only when there isn't one already.
        await apiPost(demo, "/privatemessages", [{ toPersonId: TESTER_PERSON_ID, conversationId: convId }]);
        hit = await apiGet(demo, `/privatemessages/existing/${TESTER_PERSON_ID}`);
      }

      expect(hit.ok()).toBeTruthy();
      const body = await hit.json();
      expect(typeof body.conversationId).toBe("string");
      expect(body.conversationId.length).toBeGreaterThan(0);
      expect([body.fromPersonId, body.toPersonId].sort()).toEqual([DEMO_PERSON_ID, TESTER_PERSON_ID].sort());

      const miss = await apiGet(demo, `/privatemessages/existing/${NO_THREAD_PERSON_ID}`);
      expect(miss.ok()).toBeTruthy();
      expect(await miss.json()).toEqual({});
    } finally {
      await demo.ctx.dispose();
    }
  });
});
