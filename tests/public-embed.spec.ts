import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";

// Pages a church embeds in its own website: /embed/donate, /embed/forms/{id}, /embed/calendar/{id}.
// FRM00000004 and CAL00000004 are seeded in Api/tools/dbScripts/{membership,content}/demo.sql.

// setEmbedDomains changes a church-wide setting.
test.describe.configure({ mode: "serial" });

interface LoginChurch { church?: { id?: string }; apis?: { keyName?: string; jwt?: string }[] }
interface Setting { id?: string; keyName?: string; value?: string; public?: number }
interface HostMessage { origin: string; data: { type?: string; height?: number } | null }

async function setEmbedDomains(value: string) {
  const ctx = await request.newContext();
  const login = await ctx.post(API_BASE + "/membership/users/login", {
    data: { email: "demo@b1.church", password: "password" },
    headers: { "Content-Type": "application/json" }
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const body = await login.json();
  const uc = ((body.userChurches || []) as LoginChurch[]).find((c) => c.church?.id === DEMO_CHURCH.ID);
  const jwt = uc?.apis?.find((a) => a.keyName === "ContentApi")?.jwt;
  if (!jwt) throw new Error("ContentApi JWT not present");
  const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
  const settings: Setting[] = (await (await ctx.get(API_BASE + "/content/settings", { headers })).json()) || [];
  const setting = settings.find((x) => x.keyName === "embedDomains") || { keyName: "embedDomains", public: 1 };
  setting.value = value;
  const res = await ctx.post(API_BASE + "/content/settings", { headers, data: [setting] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  // Same cache bust B1Admin fires on save.
  await ctx.post(BASE_URL + "/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
  await ctx.dispose();
}

const frameAncestors = async (req: APIRequestContext, path: string) => {
  const csp = (await req.get(path)).headers()["content-security-policy"] || "";
  const directives = csp.split("; ").filter((d) => d.startsWith("frame-ancestors "));
  expect(directives, "one frame-ancestors directive on " + path).toHaveLength(1);
  return directives[0];
};

const ALLOWED = "https://embed-test-church.org https://*.embed-test-church.org";

test.describe("Embed pages: frame policy", () => {
  test.beforeAll(async () => { await setEmbedDomains("https://www.Embed-Test-Church.org/give, not_a_domain; script-src *"); });
  test.afterAll(async () => { await setEmbedDomains(""); });

  test("/embed/donate may be framed by the church's listed website", async ({ request: req }) => {
    // The production build caches the church's settings in middleware for up to a minute.
    await expect.poll(() => frameAncestors(req, "/embed/donate"), { timeout: 90000, intervals: [2000] }).toContain(ALLOWED);
    const directive = await frameAncestors(req, "/embed/donate");
    expect(directive).toContain("'self'");
    expect(directive).toContain("https://*.b1.church");
    // Only validated hostnames reach the header.
    expect(directive).not.toContain("not_a_domain");
    expect(directive).not.toContain("script-src");
    expect(directive).not.toContain("/give");
  });

  test("the form and calendar embed routes get the same policy", async ({ request: req }) => {
    await expect.poll(() => frameAncestors(req, "/embed/forms/FRM00000004"), { timeout: 90000, intervals: [2000] }).toContain(ALLOWED);
    expect(await frameAncestors(req, "/embed/calendar/CAL00000004")).toContain(ALLOWED);
  });

  test("every other page keeps the default policy", async ({ request: req }) => {
    await expect.poll(() => frameAncestors(req, "/embed/donate"), { timeout: 90000, intervals: [2000] }).toContain(ALLOWED);
    for (const path of ["/donate", "/", "/forms/FRM00000004", "/login", "/mobile/donate", "/embed/login", "/embed/forms/FRM00000004/extra"]) {
      expect(await frameAncestors(req, path), path).not.toContain("embed-test-church.org");
    }
  });

  test("embed pages are not indexed", async ({ page, request: req }) => {
    expect((await req.get("/embed/donate")).headers()["x-robots-tag"]).toContain("noindex");
    await page.goto("/embed/donate");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("Embed pages: content", () => {
  test("/embed/donate shows the giving form without the site header, footer or sign-in button", async ({ page }) => {
    await page.goto("/embed/donate");
    await expect(page.getByTestId("embed-donate")).toBeVisible();
    await expect(page.locator('input[name="amount"]').first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator("#navbar")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
    await expect(page.getByTestId("donate-login-button")).toHaveCount(0);
    await expect(page.getByTestId("login-chip")).toHaveCount(0);
  });

  // The suite's stored session is a signed-in member, who is sent to /mobile/donate from the public /donate page.
  test("/embed/donate keeps a signed-in member on the guest form", async ({ page }) => {
    await page.goto("/embed/donate");
    await expect(page.locator('input[name="amount"]').first()).toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(/\/embed\/donate$/);
  });

  // FUN00000002 = "Building Fund" (demo.sql), a non-default fund so preselection is provable.
  test("/embed/donate?fundId=&amount= preselects the fund and amount", async ({ page }) => {
    await page.goto("/embed/donate?fundId=FUN00000002&amount=25");
    const amountInput = page.locator('input[name="amount"]').first();
    await amountInput.waitFor({ state: "visible", timeout: 15000 });
    await expect(amountInput).toHaveValue("25");
    await expect(page.getByText("Building Fund").first()).toBeVisible();
  });

  test("a link that leaves the embed opens in a new tab", async ({ page }) => {
    await page.goto("/embed/donate");
    const manage = page.locator('a[href="/mobile/donate"]');
    await expect(manage).toBeVisible({ timeout: 30000 });
    const [popup] = await Promise.all([page.waitForEvent("popup"), manage.click()]);
    await expect(popup).toHaveURL(/\/mobile\//);
    await expect(page).toHaveURL(/\/embed\/donate$/);
  });

  test("/embed/forms/{id} shows the form without the site header and submits in place", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/embed/forms/FRM00000004");

    const input = page.getByLabel(/Child Full Name/i);
    await expect(input).toBeVisible({ timeout: 15000 });
    await expect(page.locator("#navbar")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
    // Cancel would send the frame to the home page, which is not an embed route.
    await expect(page.locator("#formSubmissionBox").getByRole("button", { name: /cancel/i })).toHaveCount(0);

    await input.fill("Embed Kid");
    await page.getByLabel(/Emergency Contact Phone/i).fill("555-1234");
    await page.locator("#formSubmissionBox").getByRole("button", { name: /submit|save/i }).click();

    await expect(page.getByText("Your child is registered for Vacation Bible School! See you there.")).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/embed\/forms\/FRM00000004$/);
  });

  test("/embed/calendar/{id} shows the calendar without the site header", async ({ page }) => {
    await page.goto("/embed/calendar/CAL00000004");
    await expect(page.getByTestId("embed-calendar").locator(".rbc-calendar")).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("calendar-subscribe-button")).toBeVisible();
    await expect(page.locator("#navbar")).toHaveCount(0);
    await expect(page.locator("footer")).toHaveCount(0);
  });

  test("an embed page reports its height, and only its height, to the page that frames it", async ({ page }) => {
    // A same-origin page stands in for the church's website: 'self' is always an allowed frame ancestor.
    await page.route("**/embed-host-test", (route) => route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><title>Host</title>
<iframe id="b1" src="/embed/forms/FRM00000004" title="Form" style="width:100%;border:0" height="50"></iframe>
<script>window.b1Messages = []; window.addEventListener("message", function (e) { window.b1Messages.push({ origin: e.origin, data: e.data }); });</script>`
    }));
    await page.goto("/embed-host-test");
    await expect(page.frameLocator("#b1").getByTestId("embed-page")).toBeVisible({ timeout: 30000 });

    const heights = () => page.evaluate(() => (window as unknown as { b1Messages: HostMessage[] }).b1Messages.filter((m) => m.data?.type === "b1-embed-height"));
    await expect.poll(async () => (await heights()).length, { timeout: 30000 }).toBeGreaterThan(0);
    const last = (await heights()).pop()!;
    expect(last.origin).toBe(new URL(BASE_URL).origin);
    expect(Object.keys(last.data || {}).sort()).toEqual(["height", "type"]);
    expect(last.data?.height).toBeGreaterThan(100);
  });
});
