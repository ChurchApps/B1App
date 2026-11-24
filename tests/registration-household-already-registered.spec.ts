import { test, expect, request } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000030";
const DEMO_PERSON_ID = "PER00000082"; // Demo User, head of the seeded "User Family" household
const ALEX_PERSON_ID = "PER00000084"; // Alex User, child in that household
const TITLE = "Household Already Registered Check";

// A household member already on an active registration for the event is marked in the wizard and can't be picked again.
test.describe.serial("Registration wizard marks household members already registered", () => {
  let jwt: string;
  let eventId: string;
  let alexRegId: string;

  const auth = () => ({ headers: { Authorization: "Bearer " + jwt, "Content-Type": "application/json" } });

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const body = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const churches: { jwt?: string; church?: { id?: string } }[] = body.userChurches || [];
    jwt = (churches.find((c) => c.church?.id === CHURCH_ID) || churches[0])?.jwt as string;
    expect(jwt, "demo jwt").toBeTruthy();
    const start = new Date();
    start.setDate(start.getDate() + 14);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(12, 0, 0, 0);
    const ev = await ctx.post(`${API_BASE}/content/events`, { ...auth(), data: [{ groupId: GROUP_ID, title: TITLE, start, end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 20 }] });
    expect(ev.ok()).toBeTruthy();
    eventId = (await ev.json())[0]?.id;

    // Staff Add Attendee puts Alex on his own registration.
    const reg = await ctx.post(`${API_BASE}/content/registrations/register`, { ...auth(), data: { churchId: CHURCH_ID, eventId, personId: ALEX_PERSON_ID, members: [{ personId: ALEX_PERSON_ID, firstName: "Alex", lastName: "User" }] } });
    expect(reg.ok()).toBeTruthy();
    alexRegId = (await reg.json())?.id;
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await request.newContext();
    if (alexRegId) await ctx.delete(`${API_BASE}/content/registrations/${alexRegId}`, auth()).catch(() => { });
    if (eventId) await ctx.delete(`${API_BASE}/content/events/${eventId}`, auth()).catch(() => { });
    await ctx.dispose();
  });

  test("the household list marks Alex as already registered and won't let him be picked", async ({ page }) => {
    await page.goto("/mobile/register/" + eventId);
    await page.getByRole("button", { name: /^Continue$/i }).click();
    const household = page.getByTestId("household-members");
    await expect(household).toContainText("Alex User", { timeout: 20000 });
    await expect(page.getByTestId(`household-registered-${ALEX_PERSON_ID}`)).toBeVisible({ timeout: 15000 });
    const alex = household.getByTestId(`household-member-${ALEX_PERSON_ID}`).locator("input");
    await expect(alex).toBeDisabled();
    await expect(alex).not.toBeChecked();
  });

  test("the Api reports only the caller's household and refuses a crafted duplicate", async () => {
    const ctx = await request.newContext();
    const status = await (await ctx.get(`${API_BASE}/content/registrations/event/${eventId}/household`, auth())).json();
    expect(status.personIds).toEqual([ALEX_PERSON_ID]);

    const dup = await ctx.post(`${API_BASE}/content/registrations/register`, {
      ...auth(),
      data: { churchId: CHURCH_ID, eventId, personId: DEMO_PERSON_ID, members: [{ personId: DEMO_PERSON_ID, firstName: "Demo", lastName: "User" }, { personId: ALEX_PERSON_ID, firstName: "Alex", lastName: "User" }] }
    });
    expect(dup.status()).toBe(409);
    const body = await dup.json();
    expect(body.status).toBe("already-registered");
    expect(body.personIds).toEqual([ALEX_PERSON_ID]);
    await ctx.dispose();
  });
});
