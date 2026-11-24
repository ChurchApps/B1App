import { test, expect, request } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000030";
const DEMO_PERSON_ID = "PER00000082";
const TITLE = "Answer Questions Later Event";
const QUESTION = "T-shirt size";

// A registration with no answers to the event's form (staff-added, or from before the form) can answer them from My Registrations.
test.describe.serial("My Registrations: answer the event's questions later", () => {
  let jwt: string;
  let formId: string;
  let eventId: string;
  let regId: string;

  const auth = () => ({ headers: { Authorization: "Bearer " + jwt, "Content-Type": "application/json" } });

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const body = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const churches: { jwt?: string; church?: { id?: string } }[] = body.userChurches || [];
    jwt = (churches.find((c) => c.church?.id === CHURCH_ID) || churches[0])?.jwt as string;
    expect(jwt, "demo jwt").toBeTruthy();

    const forms = await (await ctx.post(`${API_BASE}/membership/forms`, { ...auth(), data: [{ name: `Later Answers ${Date.now()}`, contentType: "form", restricted: false }] })).json();
    formId = forms[0].id;
    await ctx.post(`${API_BASE}/membership/questions`, { ...auth(), data: [{ formId, fieldType: "Textbox", title: QUESTION, required: true }] });

    const start = new Date();
    start.setDate(start.getDate() + 15);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(12, 0, 0, 0);
    const ev = await ctx.post(`${API_BASE}/content/events`, { ...auth(), data: [{ groupId: GROUP_ID, title: TITLE, start, end, allDay: false, visibility: "public", registrationEnabled: true, capacity: 20, formId }] });
    expect(ev.ok()).toBeTruthy();
    eventId = (await ev.json())[0]?.id;

    // Registered without answering, the way a staff add or an older signup is.
    const reg = await ctx.post(`${API_BASE}/content/registrations/register`, { ...auth(), data: { churchId: CHURCH_ID, eventId, personId: DEMO_PERSON_ID, members: [{ personId: DEMO_PERSON_ID, firstName: "Demo", lastName: "User" }] } });
    expect(reg.ok()).toBeTruthy();
    regId = (await reg.json())?.id;
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await request.newContext();
    if (regId) await ctx.delete(`${API_BASE}/content/registrations/${regId}`, auth()).catch(() => { });
    if (eventId) await ctx.delete(`${API_BASE}/content/events/${eventId}`, auth()).catch(() => { });
    if (formId) await ctx.delete(`${API_BASE}/membership/forms/${formId}`, auth()).catch(() => { });
    await ctx.dispose();
  });

  test("answering links the submission to the registration and the prompt goes away", async ({ page }) => {
    await page.goto("/mobile/registrations");
    const answer = page.getByTestId(`answer-questions-${regId}`);
    await expect(answer).toBeVisible({ timeout: 30000 });
    await answer.click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(QUESTION).fill("Large");
    const linked = page.waitForResponse((r) => r.url().includes(`/registrations/${regId}`) && r.request().method() === "PUT", { timeout: 20000 });
    await dialog.getByRole("button", { name: /^Save$/i }).click();
    expect((await linked).ok()).toBeTruthy();

    await expect(answer).toHaveCount(0, { timeout: 15000 });
    const ctx = await request.newContext();
    const saved = await (await ctx.get(`${API_BASE}/content/registrations/${regId}`, auth())).json();
    expect(saved.formSubmissionId).toBeTruthy();
    await ctx.dispose();
  });
});
