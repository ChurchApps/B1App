import { test, expect, request } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

const API_BASE = "http://localhost:8084";
const CHURCH_ID = "CHU00000001";

// Per b1-mobile/events/registering.md, the registration flow is a 3-step wizard
// (Info → Members → Confirm) loaded at /mobile/register/<eventId>. Seed events
// EVT00000015 (VBS) and EVT00000016 (Missions Conference) are seeded with
// registrationEnabled=1 and capacities (content/demo.sql).

test.describe("Mobile event registration", () => {
  test("VBS event renders Info step with title and capacity", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Vacation Bible School/i, { timeout: 15000 });
    // Capacity is 50 per seed; the Info step shows "X / 50 spots filled".
    await expect(page.locator("main")).toContainText(/\/ 50 spots filled/);
  });

  test("VBS Info step has a Continue button to advance to step 2", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    await expect(page.locator("main").getByRole("button", { name: /Continue/i })).toBeVisible({ timeout: 15000 });
  });

  test("Missions Conference shows the not-yet-open state", async ({ page }) => {
    // Seeded with registrationOpenDate = today + 7 days, so registration
    // should not be open yet. Per EventRegisterPage.tsx:248-253 the page
    // shows "Registration opens <date>".
    await page.goto("/mobile/register/EVT00000016");
    await expect(page.locator("main")).toContainText(/Registration opens/i, { timeout: 15000 });
  });

  test("clicking Continue advances from Info to Members step", async ({ page }) => {
    await page.goto("/mobile/register/EVT00000015");
    const continueBtn = page.locator("main").getByRole("button", { name: /Continue/i }).first();
    await continueBtn.waitFor({ state: "visible", timeout: 15000 });
    await continueBtn.click();
    // Step 2 shows family-member selection / add controls.
    await expect(page.locator("main")).toContainText(/Add family member|Family Members|Members/i, { timeout: 15000 });
  });

  test("unknown event id shows event-not-found state", async ({ page }) => {
    await page.goto("/mobile/register/EVT99999999");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Event not found|unavailable/i, { timeout: 15000 });
  });
});

// EventRegisterPage.tsx got the same questions step as the web wizard
// (src/components/registration/EventRegister.tsx): when event.formId is set and the linked
// form is unrestricted, the Members step's "Complete Registration" advances to a questions
// step (apphelper's FormSubmissionEdit) before submitting. A disposable event is created via
// direct API calls (mirrors B1Admin/tests/registrations.spec.ts) instead of adding formId to
// the seeded VBS event, so the tests above (which assert on VBS/Missions Conference as seeded)
// are unaffected.
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
