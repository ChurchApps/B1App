import { test, expect, type Page, type Request } from "@playwright/test";

// "Email me a code" on the mobile sign-in: the member asks for a code, then signs in with it through
// /users/loginWithCode instead of the password-reset verify step. The local stack sends no mail, so the
// two code endpoints are answered here and the spec checks what the page sends and how it reacts.
const EMAIL = "demo@b1.church";
const cors = { "Access-Control-Allow-Origin": "*" };

const answerRequestCode = async (page: Page, sent: Request[]) => {
  await page.route("**/membership/users/requestLoginCode", (route) => {
    if (route.request().method() !== "POST") return route.continue();
    sent.push(route.request());
    return route.fulfill({ status: 200, headers: cors, json: { emailed: true } });
  });
};

const openEmailCode = async (page: Page) => {
  await page.goto("/mobile/login");
  await page.getByText("Email me a code").click();
  await expect(page.getByText("We'll email you a 6-digit code to sign in.")).toBeVisible({ timeout: 20000 });
  await page.locator('input[type="email"]').first().fill(EMAIL);
  await page.getByRole("button", { name: "Send code" }).click();
};

const typeCode = (page: Page, code: string) => page.locator('input[inputmode="numeric"]').first().fill(code);

test.describe("Mobile sign-in with an emailed code", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("requests a code for the email, then signs in with it, never touching the reset endpoints", async ({ page }) => {
    const requested: Request[] = [];
    const loginBodies: unknown[] = [];
    const resetCalls: string[] = [];
    await answerRequestCode(page, requested);
    await page.route(/\/membership\/users\/(forgot|verifyCode)$/, (route) => { resetCalls.push(route.request().url()); return route.continue(); });
    await page.route("**/membership/users/loginWithCode", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      loginBodies.push(route.request().postDataJSON());
      // An account with two-factor gets the authenticator step, the same as a password sign-in.
      return route.fulfill({ status: 200, headers: cors, json: { mfaRequired: true, mfaToken: "challenge" } });
    });

    await openEmailCode(page);
    await expect.poll(() => requested.length, { timeout: 20000 }).toBe(1);
    expect(requested[0].postDataJSON()).toEqual({ email: EMAIL });

    await typeCode(page, "123456");
    await expect(page.getByTestId("mfa-code")).toBeVisible({ timeout: 20000 });
    expect(loginBodies).toEqual([{ email: EMAIL, code: "123456", appName: "B1" }]);
    expect(resetCalls).toEqual([]);
  });

  test("a wrong code shows an error and stays on the code step", async ({ page }) => {
    await answerRequestCode(page, []);
    await page.route("**/membership/users/loginWithCode", (route) => {
      if (route.request().method() !== "POST") return route.continue();
      return route.fulfill({ status: 400, headers: cors, json: { errors: ["Invalid or expired code"] } });
    });

    await openEmailCode(page);
    await typeCode(page, "000000");
    await expect(page.getByText("Invalid or expired code.")).toBeVisible({ timeout: 20000 });
    await expect(page.locator('input[inputmode="numeric"]').first()).toBeVisible();
    await expect(page.getByTestId("mfa-code")).toHaveCount(0);
  });

  test("Resend asks for a new sign-in code, not a password reset", async ({ page }) => {
    const requested: Request[] = [];
    const resetCalls: string[] = [];
    await answerRequestCode(page, requested);
    await page.route(/\/membership\/users\/forgot$/, (route) => { resetCalls.push(route.request().url()); return route.continue(); });

    await page.clock.install();
    await openEmailCode(page);
    await expect.poll(() => requested.length, { timeout: 20000 }).toBe(1);
    await page.clock.runFor(31_000);
    await page.getByText("Resend code").click();
    await expect.poll(() => requested.length, { timeout: 20000 }).toBe(2);
    expect(resetCalls).toEqual([]);
  });
});
