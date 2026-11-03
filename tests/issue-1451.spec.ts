import { test, expect, type Page } from "@playwright/test";

// Issue #1451: an event the member already registered for showed no status on the Home
// "Upcoming events" list, the group's event card still offered Register, and registering
// again ended in a generic "Registration failed" instead of the server's reason.
test.describe.configure({ mode: "serial" });

const API = process.env.API_BASE || "http://localhost:8084";
const CHURCH = "CHU00000001";
const GROUP = "GRP00000030";

interface Auth { auth: string; personId: string }

async function getAuth(page: Page): Promise<Auth> {
  const reqP = page.waitForRequest((r) => r.url().includes("/content/registrations/person/") && !!r.headers()["authorization"], { timeout: 40000 });
  await page.goto("/mobile/registrations");
  const req = await reqP;
  return { auth: req.headers()["authorization"], personId: req.url().match(/person\/([^/?]+)/)?.[1] || "" };
}

const apiPost = (page: Page, path: string, data: any, a: Auth) => page.request.post(API + path, { headers: { Authorization: a.auth, "Content-Type": "application/json" }, data });

test.describe("Already-registered events", () => {
  let a: Auth;
  let eventId = "";
  const title = "Issue 1451 Lunch " + Date.now();

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    a = await getAuth(page);
    // Sooner than any seeded event, so it is the first row on Home and the group's next event.
    const start = new Date(Date.now() + 20 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const ev = { churchId: CHURCH, groupId: GROUP, title, description: "", start: start.toISOString(), end: end.toISOString(), allDay: false, visibility: "public", registrationEnabled: true, capacity: 100 };
    eventId = (await (await apiPost(page, "/content/events", [ev], a)).json())[0].id;
    const reg = await apiPost(page, "/content/registrations/register", { churchId: CHURCH, eventId, personId: a.personId }, a);
    expect(reg.ok(), "registered the demo member").toBeTruthy();
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    if (eventId) await page.request.delete(API + "/content/events/" + eventId, { headers: { Authorization: a.auth } });
    await page.close();
  });

  test("Home's Upcoming events tags the registered event", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    const events = page.getByRole("region", { name: "Upcoming events" });
    const row = events.getByTestId("dashboard-event-row").filter({ hasText: title });
    await expect(row).toHaveCount(1, { timeout: 20000 });
    await expect(row.getByTestId("dashboard-event-badge")).toHaveText("Registration");
  });

  test("the group's event card says Registered instead of offering Register", async ({ page }) => {
    await page.goto(`/mobile/groups/${GROUP}?activeTab=events`);
    await expect(page.locator("main").getByText(title)).toBeVisible({ timeout: 20000 });
    // The innermost block holding both the title and its register action is the event's card.
    const card = page.locator("main div").filter({ has: page.getByText(title) }).filter({ has: page.getByRole("link", { name: /^Register(ed)?$/ }) }).last();
    await expect(card.getByRole("link", { name: "Registered", exact: true })).toBeVisible();
    await expect(card.getByRole("link", { name: "Register", exact: true })).toHaveCount(0);
  });

  test("registering again shows the server's reason", async ({ page }) => {
    await page.goto("/mobile/register/" + eventId);
    await page.getByRole("button", { name: /Continue/i }).click();
    await page.getByRole("button", { name: /Complete Registration/i }).click();
    await expect(page.getByText("Already registered for this event")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Registration failed/)).toHaveCount(0);
  });
});
