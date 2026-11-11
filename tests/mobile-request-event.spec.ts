import { test, expect, request, type Page } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

// CA-1: Sanctuary/Fellowship Hall (auto-approved), Youth Room (approval-gated, demo pending)
const API_BASE = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";

async function demoJwt(): Promise<string> {
  const ctx = await request.newContext();
  const res = await ctx.post(`${API_BASE}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === CHURCH_ID) || body.userChurches?.[0];
  await ctx.dispose();
  return uc?.jwt as string;
}

async function fillRoomRequest(page: Page, roomName: RegExp): Promise<void> {
  await page.goto("/mobile/requestEvent");
  await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
  await page.getByTestId("request-title").locator("input").fill(`Test Request ${Date.now()}`);
  const roomSelect = page.getByTestId("booking-rooms");
  await expect(roomSelect).toBeVisible({ timeout: 15000 });
  await roomSelect.click();
  await page.getByRole("option", { name: roomName }).click();
  await page.keyboard.press("Escape");
  await page.getByTestId("request-submit").click();
  await expect(page.getByTestId("request-outcome")).toBeVisible({ timeout: 15000 });
}

test.describe("Mobile event request (CA-1)", () => {
  test.afterEach(async () => {
    // Clean up pending requests created during test.
    const jwt = await demoJwt();
    const ctx = await request.newContext();
    const res = await ctx.get(`${API_BASE}/content/events/requests/mine`, { headers: { Authorization: "Bearer " + jwt } });
    const mine = await res.json().catch(() => []);
    for (const ev of Array.isArray(mine) ? mine : []) {
      if (ev.approvalStatus === "pending" && (ev.title || "").startsWith("Test Request")) {
        await ctx.delete(`${API_BASE}/content/events/${ev.id}`, { headers: { Authorization: "Bearer " + jwt } }).catch(() => {});
      }
    }
    await ctx.dispose();
  });

  test("approval-gated room yields a pending request that can be cancelled", async ({ page }) => {
    await fillRoomRequest(page, /Youth Room/i);
    await expect(page.getByTestId("request-outcome")).toContainText(/Pending/i);

    await page.getByTestId("request-done").click();
    await expect(page).toHaveURL(/\/mobile\/myRequests/, { timeout: 15000 });
    const pendingCard = page.locator('[data-testid^="request-status-"]', { hasText: /Pending/i }).first();
    await expect(pendingCard).toBeVisible({ timeout: 15000 });

    await page.locator('[data-testid^="request-cancel-"]').first().click();
    await page.getByTestId("request-cancel-confirm").click();
    await expect(page.getByTestId("request-outcome")).toHaveCount(0);
  });

  test("room and resource pickers show each item's description", async ({ page }) => {
    await page.goto("/mobile/requestEvent");
    await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
    const roomSelect = page.getByTestId("booking-rooms");
    await expect(roomSelect).toBeVisible({ timeout: 15000 });
    await roomSelect.click();
    const sanctuary = page.getByRole("option", { name: /Sanctuary/i });
    await expect(sanctuary).toContainText("Seats 300");
    await expect(sanctuary).toContainText("Main worship space");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);

    await page.getByTestId("booking-resources").click();
    await expect(page.getByRole("option", { name: /Projector/i })).toContainText("Portable HD projector");
  });

  // #1510: a long description wraps on a phone instead of running off the edge of the menu.
  test("a long room description wraps inside the picker on a phone", async ({ page }) => {
    const jwt = await demoJwt();
    const ctx = await request.newContext();
    const auth = { headers: { Authorization: "Bearer " + jwt } };
    const name = `Zacchaeus Long Room ${Date.now()}`;
    const description = "Upstairs classroom next to the nursery with folding tables, a whiteboard, a sink, and a door to the playground for kids";
    const roomId = (await (await ctx.post(`${API_BASE}/content/rooms`, { ...auth, data: [{ name, description }] })).json())[0].id;
    try {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/mobile/requestEvent");
      await expect(mobileLogoutButton(page)).toBeVisible({ timeout: 30000 });
      await page.getByTestId("booking-rooms").click();
      const longOption = page.getByRole("option", { name: new RegExp(name) });
      await expect(longOption).toContainText("door to the playground");
      const longBox = await longOption.boundingBox();
      const shortBox = await page.getByRole("option", { name: /Sanctuary/i }).boundingBox();
      expect(longBox!.x + longBox!.width).toBeLessThanOrEqual(390);
      expect(longBox!.height).toBeGreaterThan(shortBox!.height + 10);
      const secondary = longOption.locator(".MuiListItemText-secondary");
      expect(await secondary.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    } finally {
      await ctx.delete(`${API_BASE}/content/rooms/${roomId}`, auth).catch(() => {});
      await ctx.dispose();
    }
  });

  test("no-approval room is approved immediately", async ({ page }) => {
    await fillRoomRequest(page, /Sanctuary/i);
    await expect(page.getByTestId("request-outcome")).toContainText(/Approved/i);
  });
});
