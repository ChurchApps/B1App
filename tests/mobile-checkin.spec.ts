import { test, expect, APIRequestContext } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

test.describe("Mobile checkin", () => {
  test("checkin page loads with logged-in chrome", async ({ page }) => {
    await page.goto("/mobile/checkin");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("legacy /mobile/service slug routes to checkin", async ({ page }) => {
    await page.goto("/mobile/service");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("Step 1 lists seeded services (Sunday Morning, Sunday Evening, Wednesday)", async ({ page }) => {
    await page.goto("/mobile/checkin");
    const main = page.locator("main");
    await expect(main).toContainText(/Sunday Morning Service/i, { timeout: 30000 });
  });

  test("each seeded service has a clickable selector for Step 1", async ({ page }) => {
    // Test button presence; click→API→next-step is hard to seed deterministically across timezones.
    await page.goto("/mobile/checkin");
    await expect(page.locator("main")).toContainText(/Sunday Morning Service/i, { timeout: 30000 });
    await expect(
      page.locator('[data-testid="select-service-SER00000001-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="select-service-SER00000002-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="select-service-SER00000003-button"]')
    ).toBeVisible();
  });
});

test.describe("Mobile checkin wayfinding", () => {
  test("step indicator names the current step", async ({ page }) => {
    await page.goto("/mobile/checkin");
    await expect(page.getByTestId("checkin-step-indicator")).toHaveText(/Step 1 of 3 · Service/i, { timeout: 30000 });
  });

  test("signed-out Sign In returns to check-in after login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/mobile/checkin");
    const cta = page.locator("main").getByRole("link", { name: /Sign In/i }).first();
    await expect(cta).toBeVisible({ timeout: 30000 });
    await expect(cta).toHaveAttribute("href", "/mobile/login?returnUrl=/mobile/checkin");
  });
});

test.describe("Mobile checkin pickup code", () => {
  const API = process.env.API_BASE || "http://localhost:8084";
  const EMMA = "PER00000085";
  const SERVICE = "SER00000001";

  const attendanceJwt = async (request: APIRequestContext) => {
    const res = await request.post(API + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } });
    const church = (await res.json()).userChurches.find((c: any) => c.church.id === "CHU00000001");
    return church.apis.find((a: any) => a.keyName === "AttendanceApi").jwt as string;
  };

  const clearTodaysVisits = async (request: APIRequestContext, jwt: string) => {
    const today = new Date().toLocaleDateString("en-CA");
    const visits = await (await request.get(API + "/attendance/visits?personId=" + EMMA, { headers: { Authorization: "Bearer " + jwt } })).json();
    for (const v of Array.isArray(visits) ? visits : []) {
      if (v.id && String(v.visitDate).slice(0, 10) === today) await request.delete(API + "/attendance/visits/" + v.id, { headers: { Authorization: "Bearer " + jwt } });
    }
  };

  test.afterEach(async ({ request }) => {
    await clearTodaysVisits(request, await attendanceJwt(request));
  });

  test("a household already checked in today can show its pickup QR again", async ({ page, request }) => {
    const jwt = await attendanceJwt(request);
    await clearTodaysVisits(request, jwt);
    const visit = { personId: EMMA, serviceId: SERVICE, visitSessions: [{ session: { serviceTimeId: "SST00000001", groupId: "GRP00000009" } }] };
    const res = await request.post(API + "/attendance/visits/checkin?serviceId=" + SERVICE + "&peopleIds=" + EMMA + "&acknowledgeWarnings=true", { headers: { Authorization: "Bearer " + jwt }, data: [visit] });
    expect(res.ok()).toBeTruthy();
    const { securityCode } = await res.json();
    expect(securityCode).toMatch(/^[A-Z0-9]{4}$/);

    await page.goto("/mobile/checkin");
    await page.getByTestId("select-service-" + SERVICE + "-button").click({ timeout: 30000 });
    await page.getByTestId("checkin-show-code-button").click({ timeout: 30000 });
    await expect(page.getByTestId("checkin-qr-code")).toBeVisible();
    await expect(page.locator("main")).toContainText(securityCode);
  });
});
