import { test, expect, request, type Page } from "@playwright/test";
import { mobileSignedInChrome } from "./helpers/mobile";
import { DEMO_CHURCH, SEED_PEOPLE } from "./helpers/fixtures";

const SAFE_TOP = 62;

// /mobile entry point: greeting, latest sermon, verse of the day, "More from" pills, More page, notifications

test.describe("Mobile shell", () => {
  test("/mobile redirects to /mobile/dashboard", async ({ page }) => {
    await page.goto("/mobile");
    await expect(page).toHaveURL(/\/mobile\/dashboard/);
  });

  test("dashboard shows logged-in chrome (profile avatar)", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
  });

  test("unknown mobile slug renders a not-found card with a way home", async ({ page }) => {
    await page.goto("/mobile/this-screen-does-not-exist");
    await expect(page.locator("main")).toContainText(/Page not found/i, { timeout: 15000 });
    await expect(page.locator("main")).not.toContainText(/coming soon|not yet implemented/i);
    await page.locator("main").getByRole("link", { name: /Back to home/i }).click();
    await expect(page).toHaveURL(/\/mobile\/dashboard/, { timeout: 15000 });
  });

  test("More page footer shows the church name, not a product name", async ({ page }) => {
    await page.goto("/mobile/more");
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: /Privacy Policy/i })).toBeVisible({ timeout: 15000 });
    await expect(main).toContainText(DEMO_CHURCH.NAME);
    await expect(main).not.toContainText(/B1 Mobile Web/i);
  });

  test("Me screen titles itself with the signed-in person", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true }).first()).toHaveText(SEED_PEOPLE.DEMO, { timeout: 15000 });
  });

  test("app bar shows the church name", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.locator("header:visible").first()).toContainText(DEMO_CHURCH.NAME);
  });

  test("app bar exposes notifications bell and profile avatar", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.getByRole("button", { name: /Notifications/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /^Profile$/i })).toBeVisible();
  });

  test("dashboard teases giving in place of a Give pill", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    const giving = page.getByRole("region", { name: /^Giving$/i });
    await expect(giving).toBeVisible({ timeout: 15000 });
    await expect(giving.getByRole("link", { name: "Give" })).toHaveAttribute("href", "/mobile/donate?view=give");
    await expect(page.getByRole("region", { name: new RegExp(`More from ${DEMO_CHURCH.NAME}`, "i") }).getByRole("link", { name: "Give" })).toHaveCount(0);
  });

  test("dashboard renders the Verse of the Day section", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.getByRole("region", { name: /Verse of the Day/i })).toBeVisible({ timeout: 15000 });
  });

  test("dashboard teases the latest sermon with a link to all sermons", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    const sermon = page.getByRole("region", { name: /Latest sermon/i });
    await expect(sermon).toBeVisible({ timeout: 15000 });
    await sermon.getByRole("link", { name: /All sermons/i }).click();
    await expect(page).toHaveURL(/\/mobile\/sermons/, { timeout: 15000 });
  });

  test("More page lists the church's links", async ({ page }) => {
    await page.goto("/mobile/more");
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: /Bible/i })).toBeVisible({ timeout: 15000 });
    await expect(main.getByRole("link", { name: /Sermons/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /Live/i })).toBeVisible();
  });

  test("clicking profile avatar navigates to profile edit", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await page.getByRole("button", { name: /^Profile$/i }).click();
    await expect(page).toHaveURL(/\/mobile\/profileEdit/, { timeout: 15000 });
  });

  // iOS 27 Liquid Glass chrome covers the top of the screen. The app bar and the
  // More page profile must sit in a content safe zone driven by --safe-top so a
  // non-zero top inset actually moves them.
  test.describe("content safe zone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("app bar and More page profile clear a 62px top safe inset", async ({ page }) => {
      await page.goto("/mobile/dashboard");
      const brand = page.locator("header:visible").getByText(DEMO_CHURCH.NAME);
      await expect(brand).toBeVisible({ timeout: 15000 });

      await applySafeTop(page);

      const brandBox = await brand.boundingBox();
      expect(brandBox, "app bar brand should be laid out").not.toBeNull();
      expect(
        brandBox!.y,
        `app bar brand y=${brandBox!.y} sits inside the ${SAFE_TOP}px top safe zone`
      ).toBeGreaterThanOrEqual(SAFE_TOP - 1);

      // Client-side nav keeps the injected inset.
      await page.getByRole("navigation", { name: /Main navigation/i }).getByRole("link", { name: /^More$/ }).click();
      await expect(page).toHaveURL(/\/mobile\/more/, { timeout: 15000 });
      const main = page.locator("main");
      await expect(main.getByRole("link", { name: /Edit Profile/i })).toBeVisible({ timeout: 10000 });

      const profileBox = await main.getByText(SEED_PEOPLE.DEMO, { exact: true }).boundingBox();
      expect(profileBox, "More page profile name should be laid out").not.toBeNull();
      expect(
        profileBox!.y,
        `More page profile y=${profileBox!.y} sits inside the ${SAFE_TOP}px top safe zone`
      ).toBeGreaterThanOrEqual(SAFE_TOP - 1);
    });
  });
});

// Issue #1119: in dark mode the theme toggle rendered the raw key
// "mobile.components.lightMode". Light mode hid the bug — "darkMode" already existed.
test.describe("Mobile shell dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("the More page theme toggle offers a translated switch back to light mode", async ({ page }) => {
    // MobileThemeProvider prefers a stored mode over prefers-color-scheme, so clear it.
    await page.addInitScript(() => { try { window.localStorage.removeItem("b1mobile.theme"); } catch { } });
    await page.goto("/mobile/more");

    const toggle = page.locator("main").getByRole("button", { name: "Switch to light mode", exact: true });
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await expect(toggle).toContainText("Light Mode");
    await expect(toggle).toHaveAccessibleName("Switch to light mode");
    await expect(page.locator("main"), '"mobile.components.lightMode" must never render as literal text').not.toContainText("mobile.components.");
  });
});

// Issue #1189: a church can hide the anonymous home-screen sign-in prompt or change its wording
// from B1Admin's B1 Mobile page. Both are public Membership settings read through config.appearance.
const API_BASE = process.env.API_BASE || "http://localhost:8084";
const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";
const DEFAULT_PROMPT = "Sign in to see your groups, giving, and more.";

async function setSignInPrompt(hide: boolean, text: string) {
  const ctx = await request.newContext();
  const login = await ctx.post(API_BASE + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const body = await login.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID);
  const headers = { Authorization: `Bearer ${uc?.jwt}` };
  const all = await (await ctx.get(API_BASE + "/membership/settings", { headers })).json();
  const row = (keyName: string, value: string) => ({ ...((all as any[]).find(s => s.keyName === keyName) || { churchId: DEMO_CHURCH.ID, keyName }), public: 1, value });
  const res = await ctx.post(API_BASE + "/membership/settings", { headers, data: [row("mobileHideSignInPrompt", `${hide}`), row("mobileSignInPromptText", text)] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  await ctx.post(BASE_URL + "/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
  await ctx.dispose();
}

test.describe("Mobile dashboard sign-in prompt", () => {
  // These change a church-wide setting the anonymous dashboard reads.
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 390, height: 844 } });
  test.afterAll(async () => { await setSignInPrompt(false, ""); });

  // The Sign in button sits under the welcome title; the More and Me tabs have their own Sign In links.
  const signInPill = (page: Page) => page.locator("main h1", { hasText: /^Welcome$/ }).locator("xpath=..").getByRole("link", { name: /^Sign in$/i });

  test("shows the default prompt and Sign in button to visitors", async ({ page }) => {
    await setSignInPrompt(false, "");
    await page.goto("/mobile/dashboard");
    await expect(page.getByText("Welcome", { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(DEFAULT_PROMPT, { exact: true })).toBeVisible();
    await expect(signInPill(page)).toBeVisible();
  });

  test("shows the church's own prompt wording", async ({ page }) => {
    await setSignInPrompt(false, "Sign in to get conference alerts");
    await page.goto("/mobile/dashboard");
    await expect(page.getByText("Sign in to get conference alerts", { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(DEFAULT_PROMPT, { exact: true })).toHaveCount(0);
    await expect(signInPill(page)).toBeVisible();
  });

  test("hides the prompt but keeps the welcome title when the church turns it off", async ({ page }) => {
    await setSignInPrompt(true, "Sign in to get conference alerts");
    await page.goto("/mobile/dashboard");
    await expect(page.getByText("Welcome", { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(DEFAULT_PROMPT, { exact: true })).toHaveCount(0);
    await expect(page.getByText("Sign in to get conference alerts", { exact: true })).toHaveCount(0);
    await expect(signInPill(page)).toHaveCount(0);
  });
});

async function applySafeTop(page: Page) {
  await page.addStyleTag({ content: `:root, .mobileAppRoot { --safe-top: ${SAFE_TOP}px !important; --safe-bottom: 34px !important; }` });
}
