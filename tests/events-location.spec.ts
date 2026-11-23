import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// An event can carry one optional free-text location (e.g. "City Park, shelter 3"). The public event
// page shows it as Where, above any booked rooms, and members and group leaders can enter it.
// Seed IDs: Api/tools/dbScripts/content/demo.sql — RM000000001 Sanctuary (auto-approved),
// GRP00000004 Adult Bible Class, GRP00000023 (demo user leads it; see mobile-groups.spec.ts).

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const SANCTUARY_ID = "RM000000001";
const PUBLIC_GROUP_ID = "GRP00000004";
const LEADER_GROUP_ID = "GRP00000023";

let ctx: APIRequestContext;
let auth: { headers: Record<string, string> };

test.beforeAll(async () => {
  ctx = await request.newContext();
  const loginRes = await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
  expect(loginRes.ok()).toBeTruthy();
  const body = await loginRes.json();
  const uc = (body.userChurches || []).find((c: { church?: { id?: string } }) => c.church?.id === DEMO_CHURCH.ID) || body.userChurches?.[0];
  auth = { headers: { Authorization: "Bearer " + uc.jwt } };
});

test.afterAll(async () => {
  await ctx.dispose();
});

async function createPublicEvent(title: string, extra: Record<string, unknown>, withRoom: boolean) {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start);
  end.setHours(19, 0, 0, 0);
  const evRes = await ctx.post(`${API_BASE}/content/events`, { ...auth, data: [{ groupId: PUBLIC_GROUP_ID, title, start, end, allDay: false, visibility: "public", ...extra }] });
  expect(evRes.ok()).toBeTruthy();
  const eventId: string = (await evRes.json())[0].id;
  if (withRoom) {
    const bookingRes = await ctx.post(`${API_BASE}/content/eventBookings`, { ...auth, data: [{ eventId, roomId: SANCTUARY_ID }] });
    expect(bookingRes.ok()).toBeTruthy();
  }
  return eventId;
}

async function deleteEvent(eventId: string) {
  if (eventId) await ctx.delete(`${API_BASE}/content/events/${eventId}`, auth).catch(() => { });
}

test.describe("Event location on the public event page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("shows the location as Where, above the booked rooms, and in the .ics", async ({ page }) => {
    const eventId = await createPublicEvent(`Location Page Test ${Date.now()}`, { location: "City Park, shelter 3" }, true);
    try {
      await page.goto(`/events/${eventId}`);
      const where = page.getByTestId("event-where");
      await expect(where).toBeVisible({ timeout: 30000 });
      await expect(where).toContainText("Where");
      const location = page.getByTestId("event-location");
      const rooms = page.getByTestId("event-rooms");
      await expect(location).toHaveText("City Park, shelter 3");
      await expect(rooms).toContainText("Sanctuary");
      expect((await location.boundingBox())!.y).toBeLessThan((await rooms.boundingBox())!.y);

      const icsHref = await page.getByTestId("event-add-to-calendar").getAttribute("href");
      const ics = await ctx.get(icsHref!);
      expect(ics.ok()).toBeTruthy();
      expect(await ics.text()).toContain("LOCATION:City Park\\, shelter 3");
    } finally {
      await deleteEvent(eventId);
    }
  });

  test("an event with only a booked room still shows the room as Where", async ({ page }) => {
    const eventId = await createPublicEvent(`Location Rooms Only Test ${Date.now()}`, {}, true);
    try {
      await page.goto(`/events/${eventId}`);
      await expect(page.getByTestId("event-rooms")).toContainText("Sanctuary", { timeout: 30000 });
      await expect(page.getByTestId("event-location")).toHaveCount(0);
    } finally {
      await deleteEvent(eventId);
    }
  });

  test("an event with a location and no rooms shows just the location", async ({ page }) => {
    const eventId = await createPublicEvent(`Location Only Test ${Date.now()}`, { location: "Riverside Pavilion" }, false);
    try {
      await page.goto(`/events/${eventId}`);
      await expect(page.getByTestId("event-location")).toHaveText("Riverside Pavilion", { timeout: 30000 });
      await expect(page.getByTestId("event-rooms")).toHaveCount(0);
    } finally {
      await deleteEvent(eventId);
    }
  });
});

test.describe("Entering an event location", () => {
  test.describe.configure({ mode: "serial" });

  test("a member's event request saves the location", async ({ page }) => {
    const title = `Location Request Test ${Date.now()}`;
    let eventId = "";
    try {
      await page.goto("/mobile/requestEvent");
      await page.getByTestId("request-title").locator("input").fill(title, { timeout: 30000 });
      await page.getByTestId("request-location").locator("input").fill("City Park, shelter 3");
      await page.getByTestId("request-submit").click();
      await expect(page.getByTestId("request-outcome")).toBeVisible({ timeout: 15000 });

      const mine = await (await ctx.get(`${API_BASE}/content/events/requests/mine`, auth)).json();
      const saved = (Array.isArray(mine) ? mine : []).find((e: { title?: string }) => e.title === title);
      expect(saved).toBeTruthy();
      eventId = saved.id;
      expect(saved.location).toBe("City Park, shelter 3");
    } finally {
      await deleteEvent(eventId);
    }
  });

  test("a group leader's new event saves the location and shows it when editing", async ({ page }) => {
    const title = `Location Group Test ${Date.now()}`;
    let eventId = "";
    try {
      await page.goto(`/mobile/groups/${LEADER_GROUP_ID}`);
      await page.getByRole("button", { name: /^All events$/i }).click();
      await expect(page).toHaveURL(/view=events/, { timeout: 15000 });
      const addBtn = page.getByRole("button", { name: /^Add Event$/i });
      await addBtn.waitFor({ state: "visible", timeout: 15000 });
      await addBtn.click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await dialog.locator('[data-testid="event-title-input"]').fill(title);
      await dialog.locator('[data-testid="event-location-input"]').fill("Smith family backyard");
      const saved = page.waitForResponse((r) => r.url().endsWith("/content/events") && r.request().method() === "POST");
      await dialog.getByRole("button", { name: /^Save$/ }).click();
      const savedEvents = await (await saved).json();
      eventId = savedEvents[0].id;
      expect(savedEvents[0].location).toBe("Smith family backyard");
      await expect(dialog).toBeHidden({ timeout: 10000 });

      await page.locator("main").getByText(title).first().waitFor({ state: "visible", timeout: 15000 });
      const editButton = page.getByRole("button", { name: /^Edit event$/i });
      const row = page.locator("main div").filter({ has: page.getByText(title, { exact: true }) }).filter({ has: editButton }).last();
      await row.getByRole("button", { name: /^Edit event$/i }).click();
      const editDialog = page.getByRole("dialog");
      await expect(editDialog.locator('[data-testid="event-location-input"]')).toHaveValue("Smith family backyard", { timeout: 5000 });
    } finally {
      await deleteEvent(eventId);
    }
  });
});
