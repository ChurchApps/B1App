import { test, expect } from "@playwright/test";
import { getApi, apiCall } from "./helpers/api";

// Issue #1495: tapping "Your event request ... was rejected." in the app's notifications did nothing.
const CONTENT_API = `${process.env.API_BASE || "http://localhost:8084"}/content`;

test.describe("Request decision notification (#1495)", () => {
  test("opens My Requests when tapped", async ({ page }) => {
    const api = await getApi("demo", "ContentApi");
    const title = `Issue 1495 ${Date.now()}`;
    const start = new Date(Date.now() + 7 * 86400000);
    const end = new Date(start.getTime() + 3600000);
    const created = await (await apiCall(api, "post", `${CONTENT_API}/events/request`, { title, start, end, allDay: false })).json();
    const eventId = created.event.id;
    try {
      expect((await apiCall(api, "post", `${CONTENT_API}/events/${eventId}/reject`)).ok()).toBeTruthy();

      await page.goto("/mobile/notifications");
      const row = page.getByRole("button", { name: new RegExp(`Your event request "${title}" was rejected`) });
      await expect(row).toBeVisible({ timeout: 30000 });
      await row.click();
      await expect(page).toHaveURL(/\/mobile\/myRequests/);
    } finally {
      await apiCall(api, "delete", `${CONTENT_API}/events/${eventId}`);
      await api.request.dispose();
    }
  });
});
