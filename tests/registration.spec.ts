import { test, expect, request } from "@playwright/test";

const API_BASE = "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000030"; // VBS group — already used by EVT00000015, known-good churchId scope.
const NO_FORM_TITLE = "Web Wizard Test Event (No Form)";
const WITH_FORM_TITLE = "Web Wizard Test Event (With Form)";
const FORM_ID = "FRM00000004"; // "VBS Registration (Public)" — unrestricted, contentType="form".

function futureWindow(daysOut: number) {
  const start = new Date();
  start.setDate(start.getDate() + daysOut);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(12, 0, 0, 0);
  return { start, end };
}

// Gate on count fetch (post-hydration) to avoid losing input values during hydration.
async function gotoWizard(page: import("@playwright/test").Page, eventId: string) {
  const countResp = page.waitForResponse((r) => r.url().includes(`/registrations/event/${eventId}/count`), { timeout: 30000 });
  await page.goto(`/register/${eventId}`);
  await countResp;
}

async function fillGuestInfo(main: import("@playwright/test").Locator, firstName: string, lastName: string, email: string) {
  const first = main.getByLabel("First Name");
  await expect(async () => {
    await first.fill(firstName);
    await expect(first).toHaveValue(firstName, { timeout: 1000 });
  }).toPass({ timeout: 20000 });
  await main.getByLabel("Last Name").fill(lastName);
  await main.getByLabel("Email").fill(email);
}

test.describe.serial("Public event registration wizard (web /register/<eventId>)", () => {
  let staffJwt: string;
  let noFormEventId: string;
  let withFormEventId: string;
  let noFormRegId: string;
  let withFormRegId: string;
  let formSubmissionId: string;

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const loginRes = await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    const uc = (loginBody.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || loginBody.userChurches?.[0];
    staffJwt = uc?.jwt as string;
    expect(staffJwt, "staff jwt").toBeTruthy();
    const auth = { headers: { Authorization: "Bearer " + staffJwt } };

    const noFormWindow = futureWindow(10);
    const withFormWindow = futureWindow(11);

    const eventsRes = await ctx.post(`${API_BASE}/content/events`, {
      ...auth,
      data: [
        { groupId: GROUP_ID, title: NO_FORM_TITLE, start: noFormWindow.start, end: noFormWindow.end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 20 },
        { groupId: GROUP_ID, title: WITH_FORM_TITLE, start: withFormWindow.start, end: withFormWindow.end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 20, formId: FORM_ID }
      ]
    });
    expect(eventsRes.ok()).toBeTruthy();
    const created = await eventsRes.json();
    noFormEventId = created[0]?.id;
    withFormEventId = created[1]?.id;
    expect(noFormEventId, "no-form event id").toBeTruthy();
    expect(withFormEventId, "with-form event id").toBeTruthy();
    await ctx.dispose();
  });

  test.afterAll(async () => {
    try {
      const ctx = await request.newContext();
      const auth = { headers: { Authorization: "Bearer " + staffJwt } };
      for (const id of [noFormRegId, withFormRegId]) {
        if (id) await ctx.delete(`${API_BASE}/content/registrations/${id}`, auth).catch(() => { });
      }
      if (formSubmissionId) await ctx.delete(`${API_BASE}/membership/formsubmissions/${formSubmissionId}`, auth).catch(() => { });
      for (const id of [noFormEventId, withFormEventId]) {
        if (id) await ctx.delete(`${API_BASE}/content/events/${id}`, auth).catch(() => { });
      }
      await ctx.dispose();
    } catch { /* ignore */ }
  });

  test("event without a linked form completes the unchanged direct-submit flow", async ({ page }) => {
    await gotoWizard(page, noFormEventId);
    const main = page.locator("main");
    await expect(main.getByText(NO_FORM_TITLE)).toBeVisible({ timeout: 15000 });

    await fillGuestInfo(main, "Webby", "NoFormGuest", "webby.noform.guest@example.com");
    await main.getByRole("button", { name: /^Continue$/i }).click();
    await expect(main.getByText("Additional Members")).toBeVisible({ timeout: 10000 });

    const registerPost = page.waitForResponse((r) => r.url().includes("/registrations/register") && r.request().method() === "POST", { timeout: 15000 });
    await main.getByRole("button", { name: /Complete Registration/i }).click();
    const regResp = await registerPost;
    expect(regResp.ok(), "register response ok").toBeTruthy();
    noFormRegId = (await regResp.json())?.id;

    await expect(main.getByText("Registration Confirmed!")).toBeVisible({ timeout: 15000 });
    await expect(main.getByText(NO_FORM_TITLE).first()).toBeVisible();
  });

  test("event with a linked unrestricted form shows the questions step before completing registration", async ({ page }) => {
    await gotoWizard(page, withFormEventId);
    const main = page.locator("main");
    await expect(main.getByText(WITH_FORM_TITLE)).toBeVisible({ timeout: 15000 });

    await fillGuestInfo(main, "Webby", "WithFormGuest", "webby.withform.guest@example.com");
    await main.getByRole("button", { name: /^Continue$/i }).click();
    await expect(main.getByText("Additional Members")).toBeVisible({ timeout: 10000 });
    await main.getByRole("button", { name: /Complete Registration/i }).click();

    await expect(main.getByText("Questions", { exact: true })).toBeVisible({ timeout: 15000 });
    await page.getByLabel(/Child Full Name/i).fill("Wizard Test Child");
    await page.getByLabel(/Emergency Contact Phone/i).fill("555-2468");

    const submissionPost = page.waitForResponse((r) => r.url().includes("/formsubmissions") && r.request().method() === "POST", { timeout: 15000 });
    const registerPost = page.waitForResponse((r) => r.url().includes("/registrations/register") && r.request().method() === "POST", { timeout: 15000 });
    await page.locator("#formSubmissionBox").getByRole("button", { name: /submit|save/i }).click();

    const subResp = await submissionPost;
    expect(subResp.ok(), "form submission response ok").toBeTruthy();
    formSubmissionId = (await subResp.json())?.[0]?.id;

    const regResp = await registerPost;
    expect(regResp.ok(), "register response ok").toBeTruthy();
    withFormRegId = (await regResp.json())?.id;

    await expect(main.getByText("Registration Confirmed!")).toBeVisible({ timeout: 15000 });
    await expect(main.getByText(WITH_FORM_TITLE).first()).toBeVisible();
  });
});

const HOUSEHOLD_TITLE = "Household Wizard Test Event";
const DEMO_PERSON_ID = "PER00000082"; // Demo User, head of the seeded "User Family" household
const ALEX_PERSON_ID = "PER00000084"; // Alex User, child born 2015

test.describe.serial("Household registration pre-fill (logged-in member)", () => {
  let staffJwt: string;
  let eventId: string;
  let adultTypeId: string;
  let childTypeId: string;
  let regId: string;

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const loginRes = await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    const uc = (loginBody.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || loginBody.userChurches?.[0];
    staffJwt = uc?.jwt as string;
    const auth = { headers: { Authorization: "Bearer " + staffJwt } };

    const window = futureWindow(12);
    const eventsRes = await ctx.post(`${API_BASE}/content/events`, {
      ...auth,
      data: [{ groupId: GROUP_ID, title: HOUSEHOLD_TITLE, start: window.start, end: window.end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 20 }]
    });
    expect(eventsRes.ok()).toBeTruthy();
    eventId = (await eventsRes.json())[0]?.id;
    expect(eventId, "household event id").toBeTruthy();

    const typesRes = await ctx.post(`${API_BASE}/content/registrations/types`, {
      ...auth,
      data: [
        { eventId, name: "Household Adult", price: null, minAgeYears: 18, sort: 1 },
        { eventId, name: "Household Child", price: null, maxAgeYears: 17, sort: 2 }
      ]
    });
    expect(typesRes.ok()).toBeTruthy();
    const types = await typesRes.json();
    adultTypeId = types[0]?.id;
    childTypeId = types[1]?.id;
    expect(childTypeId, "child type id").toBeTruthy();
    await ctx.dispose();
  });

  test.afterAll(async () => {
    try {
      const ctx = await request.newContext();
      const auth = { headers: { Authorization: "Bearer " + staffJwt } };
      if (regId) await ctx.delete(`${API_BASE}/content/registrations/${regId}`, auth).catch(() => { });
      for (const id of [adultTypeId, childTypeId]) {
        if (id) await ctx.delete(`${API_BASE}/content/registrations/types/${id}`, auth).catch(() => { });
      }
      if (eventId) await ctx.delete(`${API_BASE}/content/events/${eventId}`, auth).catch(() => { });
      await ctx.dispose();
    } catch { /* ignore */ }
  });

  test("household members are listed and register in one call with the age-fit type", async ({ page }) => {
    // The wizard reads the person from UserContext, which only the in-app login populates on public pages.
    await page.goto(`/login?returnUrl=${encodeURIComponent("/register/" + eventId)}`);
    await page.fill('input[type="email"]', "demo@b1.church");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL(new RegExp(`/register/${eventId}`), { timeout: 60000 });
    const main = page.locator("main");
    await expect(main.getByText(HOUSEHOLD_TITLE).first()).toBeVisible({ timeout: 30000 });
    await expect(main.getByText("Demo User")).toBeVisible({ timeout: 15000 });

    await page.getByTestId("primary-type").click();
    await page.getByRole("option", { name: /Household Adult/i }).click();
    await main.getByRole("button", { name: /^Continue$/i }).click();
    await expect(main.getByText("Additional Members")).toBeVisible({ timeout: 15000 });

    const household = page.getByTestId("household-members");
    await expect(household).toContainText("Jane User");
    await expect(household).toContainText("Alex User");
    await expect(household).toContainText("Emma User");

    const alex = household.getByTestId(`household-member-${ALEX_PERSON_ID}`).locator("input");
    await alex.check();
    await expect(alex).toBeChecked();
    await expect(page.getByTestId(`household-type-${ALEX_PERSON_ID}`)).toContainText("Household Child");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByTestId("household-members")).toBeInViewport();
    await page.screenshot({ path: ".pr-screenshots/household-registration-after.png", fullPage: true });

    const registerPost = page.waitForResponse((r) => r.url().includes("/registrations/register") && r.request().method() === "POST", { timeout: 20000 });
    await main.getByRole("button", { name: /Complete Registration/i }).click();
    const regResp = await registerPost;
    expect(regResp.ok(), "register response ok").toBeTruthy();
    const body = await regResp.json();
    regId = body?.id;

    expect(body.members).toHaveLength(2);
    expect(body.members.map((m: any) => m.personId).sort()).toEqual([DEMO_PERSON_ID, ALEX_PERSON_ID].sort());
    const alexMember = body.members.find((m: any) => m.personId === ALEX_PERSON_ID);
    expect(alexMember.registrationTypeId).toBe(childTypeId);

    await expect(main.getByText("Registration Confirmed!")).toBeVisible({ timeout: 20000 });
  });
});
