import { test, expect } from "@playwright/test";
import { getApi, apiCall, doingUrl } from "./helpers/api";

// Issue 1325: the PWA counted the signup deadline back from midnight UTC on the service
// date, so on the service day any deadline showed "Signup deadline has passed" even when
// the service was hours away. The Api now sends the deadline, anchored on the first
// service time. Plan: today, a service six hours from now, a one-hour deadline — open.
test.describe("Issue 1325 — signup deadline counts back from the service time", () => {
  let planId = "";
  const positionName = "E2E 1325 Greeter";

  test.beforeAll(async () => {
    const api = await getApi("demo");
    const template = await (await apiCall(api, "get", doingUrl("/plans/PLA00000001"))).json();
    const now = new Date();
    const serviceDate = now.toISOString().split("T")[0];
    const start = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const [plan] = await (await apiCall(api, "post", doingUrl("/plans"), [{ ministryId: template.ministryId, planTypeId: template.planTypeId, name: "E2E 1325 Service", serviceDate, signupDeadlineHours: 1 }])).json();
    planId = plan.id;
    await apiCall(api, "post", doingUrl("/times"), [{ planId, displayName: "Service", startTime: start.toISOString(), endTime: end.toISOString(), teams: "", serviceTimeType: "service" }]);
    await apiCall(api, "post", doingUrl("/positions"), [{ planId, categoryName: "Hospitality", name: positionName, count: 2, allowSelfSignup: true }]);
  });

  test("signup stays open on the service day until the deadline before the service", async ({ page }) => {
    await page.goto(`/mobile/volunteer/${planId}`, { timeout: 60000 });
    const main = page.locator("main");
    await expect(main.getByText(positionName)).toBeVisible({ timeout: 30000 });
    await expect(main.getByText("Signup deadline has passed.")).toHaveCount(0);
    await expect(main.getByRole("button", { name: /^Sign Up$/i }).first()).toBeEnabled();
  });
});
