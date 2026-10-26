import crypto from "crypto";
import { test, expect, request, type APIRequestContext } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:8084";
// Seeded only for this spec, so password sign-ins elsewhere never meet a code prompt.
const EMAIL = "twofactor@b1.church";

const totp = (secret: string, offsetSteps = 0) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = secret.split("").map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0")).join("");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + offsetSteps));
  const hmac = crypto.createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  return ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
};

const login = async (ctx: APIRequestContext, email: string) => (await ctx.post(`${API_BASE}/membership/users/login`, { data: { email, password: "password" } })).json();

// Demo is a server admin, so it can clear the test account's 2FA whatever state a failed run left it in.
const resetTwoFactor = async (ctx: APIRequestContext) => {
  const demo = await login(ctx, "demo@b1.church");
  const adminChurch = demo.userChurches.find((uc: any) => uc.apis?.some((a: any) => a.permissions?.some((p: any) => p.contentType === "Server"))) || demo.userChurches[0];
  const headers = { Authorization: "Bearer " + adminChurch.jwt };
  const target = await (await ctx.get(`${API_BASE}/membership/users/search?term=${encodeURIComponent(EMAIL)}`, { headers })).json();
  const reset = await ctx.post(`${API_BASE}/membership/users/mfa/reset/${target[0].id}`, { headers });
  expect(reset.ok()).toBeTruthy();
};

test.describe("Two-factor sign-in", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: { cookies: [], origins: [] } });

  let secret = "";
  let backupCodes: string[] = [];

  test.beforeAll(async () => {
    const ctx = await request.newContext();
    await resetTwoFactor(ctx);
    const jwt = (await login(ctx, EMAIL)).userChurches[0].jwt;
    const headers = { Authorization: "Bearer " + jwt };
    secret = (await (await ctx.post(`${API_BASE}/membership/users/mfa/setup`, { headers })).json()).secret;
    backupCodes = (await (await ctx.post(`${API_BASE}/membership/users/mfa/enable`, { headers, data: { code: totp(secret) } })).json()).backupCodes;
    await ctx.dispose();
  });

  test.afterAll(async () => {
    const ctx = await request.newContext();
    await resetTwoFactor(ctx);
    await ctx.dispose();
  });

  test("the website login asks for an authenticator code", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');
    await expect(page.locator("#mfa-code")).toBeVisible({ timeout: 20000 });
    // Setup spent the current time step; the next one is still inside the drift window.
    await page.fill("#mfa-code", totp(secret, 1));
    await page.getByRole("button", { name: "Verify Code" }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
  });

  test("the mobile login takes a backup code", async ({ page }) => {
    await page.goto("/mobile/login");
    await page.locator('input[type="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill("password");
    await page.locator('button[type="submit"]').first().click();
    const code = page.getByTestId("mfa-code");
    await expect(code).toBeVisible({ timeout: 20000 });
    await code.fill("wrong-code");
    await page.locator('button[type="submit"]').first().click();
    await expect(page.getByText("That code didn't work")).toBeVisible();
    await code.fill(backupCodes[0]);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });
  });
});
