import { test, expect, request } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";

test.describe("Mobile event registration", () => {
  test("VBS event renders Info step with title and capacity", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Vacation Bible School/i, { timeout: 15000 });
    await expect(page.locator("main")).toContainText(/\/ 50 spots filled/);
  });

  test("VBS Info step has a Continue button to advance to step 2", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    await expect(page.locator("main").getByRole("button", { name: /Continue/i })).toBeVisible({ timeout: 15000 });
  });

  test("Missions Conference shows the not-yet-open state", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000016");
    await expect(page.locator("main")).toContainText(/Registration opens/i, { timeout: 15000 });
  });

  test("clicking Continue advances from Info to Members step", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    await page.getByTestId("primary-type").click();
    await page.getByRole("option", { name: /Chaperone/i }).click();
    const continueBtn = page.locator("main").getByRole("button", { name: /Continue/i }).first();
    await continueBtn.waitFor({ state: "visible", timeout: 15000 });
    await continueBtn.click();
    await expect(page.locator("main")).toContainText(/Add family member|Family Members|Members/i, { timeout: 15000 });
  });

  test("unknown event id shows event-not-found state", async ({ page }) => {
    await page.goto("/mobile/register/EVT99999999");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Event not found|unavailable/i, { timeout: 15000 });
  });
});

// Event with linked form created via API to avoid affecting seeded VBS/Missions Conference tests.
test.describe.serial("Mobile event registration — linked form (questions step)", () => {
  let staffJwt: string;
  let eventId: string;
  let registrationId: string;
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

    const start = new Date();
    start.setDate(start.getDate() + 12);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(12, 0, 0, 0);

    const res = await ctx.post(`${API_BASE}/content/events`, {
      ...auth,
      data: [{ groupId: "GRP00000030", title: "Mobile Wizard Test Event (With Form)", start, end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 20, formId: "FRM00000004" }]
    });
    expect(res.ok()).toBeTruthy();
    const created = await res.json();
    eventId = created[0]?.id;
    expect(eventId, "created event id").toBeTruthy();
    await ctx.dispose();
  });

  test.afterAll(async () => {
    try {
      const ctx = await request.newContext();
      const auth = { headers: { Authorization: "Bearer " + staffJwt } };
      if (registrationId) await ctx.delete(`${API_BASE}/content/registrations/${registrationId}`, auth).catch(() => { });
      if (formSubmissionId) await ctx.delete(`${API_BASE}/membership/formsubmissions/${formSubmissionId}`, auth).catch(() => { });
      if (eventId) await ctx.delete(`${API_BASE}/content/events/${eventId}`, auth).catch(() => { });
      await ctx.dispose();
    } catch { /* ignore */ }
  });

  test("registering for an event with a linked unrestricted form shows the questions step", async ({ page }) => {
    await page.goto(`/mobile/register/${eventId}`);
    await expect(mobileLogoutButton(page)).toBeVisible();

    const continueBtn = page.locator("main").getByRole("button", { name: /Continue/i }).first();
    await continueBtn.waitFor({ state: "visible", timeout: 15000 });
    await continueBtn.click();
    await expect(page.locator("main")).toContainText(/Additional Members/i, { timeout: 15000 });

    const completeBtn = page.locator("main").getByRole("button", { name: /Complete Registration/i }).first();
    await completeBtn.click();
    await expect(page.locator("main")).toContainText(/Questions/i, { timeout: 15000 });

    await page.getByLabel(/Child Full Name/i).fill("Mobile Wizard Test Child");
    await page.getByLabel(/Emergency Contact Phone/i).fill("555-9876");

    const submissionPost = page.waitForResponse((r) => r.url().includes("/formsubmissions") && r.request().method() === "POST", { timeout: 15000 });
    const registerPost = page.waitForResponse((r) => r.url().includes("/registrations/register") && r.request().method() === "POST", { timeout: 15000 });
    await page.locator("#formSubmissionBox").getByRole("button", { name: /submit|save/i }).click();

    const subResp = await submissionPost;
    expect(subResp.ok(), "form submission response ok").toBeTruthy();
    formSubmissionId = (await subResp.json())?.[0]?.id;

    const regResp = await registerPost;
    expect(regResp.ok(), "register response ok").toBeTruthy();
    registrationId = (await regResp.json())?.id;

    await expect(page.locator("main")).toContainText(/Registration Confirmed/i, { timeout: 15000 });
  });
});

test.describe("Mobile event registration — multi-day event dates", () => {
  let jwt = "";
  const eventIds: string[] = [];
  const auth = () => ({ headers: { Authorization: "Bearer " + jwt } });
  const medium = (d: Date) => d.toLocaleDateString("en-US", { dateStyle: "medium" });

  const timedStart = new Date();
  timedStart.setDate(timedStart.getDate() + 30);
  timedStart.setHours(18, 0, 0, 0);
  const timedEnd = new Date(timedStart);
  timedEnd.setDate(timedEnd.getDate() + 2);
  timedEnd.setHours(12, 0, 0, 0);

  // Noon keeps all-day dates on the same calendar day in any nearby timezone.
  const allDayStart = new Date();
  allDayStart.setDate(allDayStart.getDate() + 33);
  allDayStart.setHours(12, 0, 0, 0);
  const allDayEnd = new Date(allDayStart);
  allDayEnd.setDate(allDayEnd.getDate() + 3);

  async function createEvent(title: string, start: Date, end: Date, allDay: boolean) {
    const ctx = await request.newContext();
    const res = await ctx.post(`${API_BASE}/content/events`, { ...auth(), data: [{ groupId: "GRP00000030", title, start, end, allDay, visibility: "public", registrationEnabled: true }] });
    expect(res.ok()).toBeTruthy();
    const id = (await res.json())[0].id as string;
    eventIds.push(id);
    await ctx.dispose();
    return id;
  }

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const loginBody = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    jwt = ((loginBody.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || loginBody.userChurches[0]).jwt;
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await request.newContext();
    for (const id of eventIds) await ctx.delete(`${API_BASE}/content/events/${id}`, auth()).catch(() => { });
    await ctx.dispose();
  });

  test("a timed event spanning days shows its end date", async ({ page }) => {
    const id = await createEvent("Mobile Multi-Day Retreat", timedStart, timedEnd, false);
    await page.goto(`/mobile/register/${id}`);
    await expect(page.getByText("Mobile Multi-Day Retreat").first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator("main")).toContainText(medium(timedEnd));
  });

  test("an all-day event spanning days shows both dates", async ({ page }) => {
    const id = await createEvent("Mobile All-Day Camp", allDayStart, allDayEnd, true);
    await page.goto(`/mobile/register/${id}`);
    await expect(page.getByText("Mobile All-Day Camp").first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator("main")).toContainText(`${medium(allDayStart)} - ${medium(allDayEnd)}`);
  });
});
