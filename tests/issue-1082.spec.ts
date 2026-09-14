import { test, expect, request } from "@playwright/test";

// Issue #1082: raw i18n keys leak into the UI anywhere a label key is built from a
// prefix plus a variable. Locale.label() returns the key itself when en.json has no
// entry, and /locale-sync only harvests static string literals, so every key reached
// through `const l = (key) => Locale.label("prefix." + key)` was never added.
//
// Reported sample: mobile My Groups > Edit event renders the reminder toggle as
// "mobile.group.reminders.enable" and its button as "mobile.group.reminders.saveReminder".
const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const GROUP_ID = "GRP00000023";

test.describe.serial("Issue #1082 - mobile event reminders show English, not raw locale keys", () => {
  const title = `Reminder Label Test ${Date.now()}`;
  let eventId: string;
  let auth: { headers: { Authorization: string } };

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    const login = await (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = (login.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || login.userChurches?.[0];
    auth = { headers: { Authorization: "Bearer " + (uc?.jwt as string) } };

    // Today, so the event lands on the calendar day the tab opens to.
    const start = new Date();
    start.setHours(18, 0, 0, 0);
    const end = new Date(start);
    end.setHours(19, 0, 0, 0);
    const created = await (await ctx.post(`${API_BASE}/content/events`, {
      ...auth,
      data: [{ groupId: GROUP_ID, title, start, end, allDay: false, visibility: "public" }]
    })).json();
    eventId = (Array.isArray(created) ? created[0] : created)?.id;
    expect(eventId, "created event id").toBeTruthy();
    await ctx.dispose();
  });

  // Leave no event behind: a stray row makes the neighboring group specs pick the wrong row.
  test.afterAll(async () => {
    const ctx = await request.newContext();
    if (eventId) await ctx.delete(`${API_BASE}/content/events/${eventId}`, auth);
    await ctx.dispose();
  });

  test("the reminder controls in the Edit event dialog are localized", async ({ page }) => {
    await page.goto(`/mobile/groups/${GROUP_ID}`);
    await expect(page.getByRole("tab", { name: /Events/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole("tab", { name: /Events/i }).click();

    const editEvent = page.getByRole("button", { name: /^Edit event$/i });
    const card = page
      .locator("main div")
      .filter({ hasText: title })
      .filter({ has: editEvent })
      .last();
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.getByRole("button", { name: /^Edit event$/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText(/^Edit event$/i)).toBeVisible();

    // The defect: the reminder toggle and its button render literal keys.
    await expect(dialog).not.toContainText("mobile.group.reminders.");
    await expect(dialog.getByText("Send reminders", { exact: true })).toBeVisible({ timeout: 10000 });
  });
});
