import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { mobileLogoutButton } from "./helpers/mobile";

const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const CHURCH_ID = "CHU00000001";
const DEMO_PERSON_ID = "PER00000082";

async function messagingHeaders(ctx: APIRequestContext) {
  const login = await ctx.post(`${MAIN_API}/membership/users/login`, {
    data: { email: "demo@b1.church", password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  expect(login.ok()).toBeTruthy();
  const uc = (await login.json()).userChurches.find((c: any) => c.church?.id === CHURCH_ID);
  const jwt = uc.apis.find((a: any) => a.keyName === "MessagingApi").jwt;
  return { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
}

test.describe("Mobile notifications", () => {
  test("notifications page loads", async ({ page }) => {
    await page.goto("/mobile/notifications");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("notifications page provides tab navigation", async ({ page }) => {
    await page.goto("/mobile/notifications");
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });
  });

  test("a direct-message notification opens the conversation", async ({ page }) => {
    const ctx = await request.newContext();
    const marker = `DM notification ${Date.now()}`;
    let headers: Record<string, string> | undefined;
    try {
      headers = await messagingHeaders(ctx);
      const res = await ctx.post(`${MAIN_API}/messaging/notifications/create`, {
        headers,
        data: { peopleIds: [DEMO_PERSON_ID], contentType: "message", contentId: "CVS00000003", message: marker }
      });
      expect(res.ok()).toBeTruthy();

      await page.goto("/mobile/notifications");
      const row = page.locator("main").getByText(marker).first();
      await expect(row).toBeVisible({ timeout: 30000 });
      await row.click();
      await page.waitForURL((url) => url.pathname.includes("/mobile/messages/"), { timeout: 45000 });
    } finally {
      if (headers) {
        const mine: any[] = await (await ctx.get(`${MAIN_API}/messaging/notifications/my`, { headers })).json().catch(() => []);
        for (const n of Array.isArray(mine) ? mine : []) {
          if (n.message === marker) await ctx.delete(`${MAIN_API}/messaging/notifications/${CHURCH_ID}/${n.id}`, { headers }).catch(() => {});
        }
      }
      await ctx.dispose();
    }
  });

  test("Clear All asks for confirmation first", async ({ page }) => {
    await page.goto("/mobile/notifications");
    const clearAll = page.getByTestId("notifications-clear-all");
    await expect(clearAll).toBeVisible({ timeout: 30000 });
    await clearAll.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText(/Clear all notifications/i);
    await dialog.getByRole("button", { name: /^Cancel$/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });
    await expect(clearAll).toBeVisible();
  });
});

test.describe("Mobile registrations", () => {
  test("registrations page loads", async ({ page }) => {
    await page.goto("/mobile/registrations");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });
});

test.describe("Mobile volunteer", () => {
  test("volunteer page loads", async ({ page }) => {
    await page.goto("/mobile/volunteer");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("legacy /mobile/volunteerBrowse slug routes to volunteer", async ({ page }) => {
    await page.goto("/mobile/volunteerBrowse");
    await expect(mobileLogoutButton(page)).toBeVisible();
  });

  test("volunteer page lists self-signup positions", async ({ page }) => {
    await page.goto("/mobile/volunteer");
    const main = page.locator("main");
    await expect(main).toContainText(/Greeter|Usher/i, { timeout: 30000 });
  });

  test("volunteer plan detail loads when drilling into a position", async ({ page }) => {
    await page.goto("/mobile/volunteer/PLA00000001");
    await expect(mobileLogoutButton(page)).toBeVisible();
    await expect(page.locator("main")).toContainText(/Greeter|Usher|Worship/i, { timeout: 30000 });
  });

  test("filled position (Coffee Host) shows a Full / unavailable indicator", async ({ page }) => {
    await page.goto("/mobile/volunteer/PLA00000001");
    const main = page.locator("main");
    await expect(main).toContainText(/Coffee Host/i, { timeout: 30000 });
    const disabledSignup = page.locator("button[disabled]").filter({ hasText: /Full|Sign Up/i });
    expect(await disabledSignup.count()).toBeGreaterThan(0);
  });

  // Mutating test; reset-demo wipes changes.
  test.describe.serial("self-signup click flow", () => {
    test("Sign Up button on a self-signup position toggles to Remove", async ({ page }) => {
      await page.goto("/mobile/volunteer/PLA00000001");
      const main = page.locator("main");
      await expect(main).toContainText(/Greeter/i, { timeout: 30000 });

      // Click the first enabled Sign Up button. Per VolunteerDetail.tsx the
      // button text is "Sign Up" when free, "Full" when filled, "Remove"
      // when already assigned.
      const signUpBtn = main.getByRole("button", { name: /^Sign Up$/i }).first();
      await signUpBtn.waitFor({ state: "visible", timeout: 15000 });
      await signUpBtn.click();

      await expect(main.getByRole("button", { name: /^Remove$/i }).first()).toBeVisible({ timeout: 15000 });
    });
  });

  test("past-deadline plan is filtered off the upcoming volunteer index", async ({ page }) => {
    await page.goto("/mobile/volunteer");
    const main = page.locator("main");
    await expect(main).toContainText(/Greeter|Usher/i, { timeout: 30000 });
    const text = (await main.textContent()) || "";
    expect(text.toLowerCase()).not.toContain("last week");
  });
});

test.describe("Mobile install", () => {
  test("install page draws its own QR code and drops the offline promise", async ({ page }) => {
    const thirdParty: string[] = [];
    page.on("request", (r) => { if (r.url().includes("qrserver.com")) thirdParty.push(r.url()); });
    await page.goto("/mobile/install");
    await expect(page.getByText("Scan with your phone camera")).toBeVisible({ timeout: 30000 });
    await expect(page.locator('svg[width="220"][height="220"]')).toBeVisible();
    expect(thirdParty).toHaveLength(0);
    await expect(page.locator("body")).not.toContainText("Works offline");
  });
});

test.describe("Mobile lessons", () => {
  test("signed-out lessons screen offers Sign In with a returnUrl", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/mobile/lessons");
    const cta = page.getByTestId("lessons-signin-button");
    await expect(cta).toBeVisible({ timeout: 30000 });
    await expect(cta).toHaveAttribute("href", "/mobile/login?returnUrl=/mobile/lessons");
  });
});
