import { test, expect, request } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000030";
const TITLE = "Issue 1445 Stewardship Lunch";
const DEMO_PERSON_ID = "PER00000082"; // Demo User
const ALEX_PERSON_ID = "PER00000084"; // Alex User, Demo User's household

// ChurchAppsSupport#1445: on an event without attendee types the wizard sent only the extra members,
// so the signed-in registrant was never saved as an attendee.
test.describe.serial("Signed-in registration on an event without attendee types (#1445)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  let staffJwt: string;
  let eventId: string;
  let regId: string;

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const body = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    staffJwt = ((body.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || body.userChurches?.[0])?.jwt;
    const start = new Date();
    start.setDate(start.getDate() + 13);
    start.setHours(11, 0, 0, 0);
    const end = new Date(start);
    end.setHours(13, 0, 0, 0);
    const res = await ctx.post(`${API_BASE}/content/events`, {
      headers: { Authorization: "Bearer " + staffJwt },
      data: [{ groupId: GROUP_ID, title: TITLE, start, end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 20 }]
    });
    expect(res.ok()).toBeTruthy();
    eventId = (await res.json())[0]?.id;
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await request.newContext();
    const auth = { headers: { Authorization: "Bearer " + staffJwt } };
    if (regId) await ctx.delete(`${API_BASE}/content/registrations/${regId}`, auth).catch(() => { });
    if (eventId) await ctx.delete(`${API_BASE}/content/events/${eventId}`, auth).catch(() => { });
    await ctx.dispose();
  });

  test("saves the registrant along with the household member they add", async ({ page }) => {
    await page.goto(`/login?returnUrl=${encodeURIComponent("/register/" + eventId)}`);
    await page.fill('input[type="email"]', "demo@b1.church");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL(new RegExp(`/register/${eventId}`), { timeout: 60000 });
    const main = page.locator("main");
    await expect(main.getByText(TITLE).first()).toBeVisible({ timeout: 30000 });
    await expect(main.getByText("Demo User")).toBeVisible({ timeout: 15000 });
    await main.getByRole("button", { name: /^Continue$/i }).click();

    const alex = page.getByTestId("household-members").getByTestId(`household-member-${ALEX_PERSON_ID}`).locator("input");
    await alex.check();
    await expect(alex).toBeChecked();

    const registerPost = page.waitForResponse((r) => r.url().includes("/registrations/register") && r.request().method() === "POST", { timeout: 20000 });
    await main.getByRole("button", { name: /Complete Registration/i }).click();
    const regResp = await registerPost;
    expect(regResp.ok()).toBeTruthy();
    const body = await regResp.json();
    regId = body?.id;
    await expect(main.getByText("Registration Confirmed!")).toBeVisible({ timeout: 20000 });

    const members = (body.members || []).map((m: any) => ({ personId: m.personId, name: `${m.firstName} ${m.lastName}` }));
    expect(members).toEqual([{ personId: DEMO_PERSON_ID, name: "Demo User" }, { personId: ALEX_PERSON_ID, name: "Alex User" }]);
  });
});
