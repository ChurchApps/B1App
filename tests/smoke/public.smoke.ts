import { test, expect, openAndLoad, expectHeading } from "./fixtures";

// Built-in routes every church site has. Assertions stay church-neutral (no names, times or copy)
// so the suite runs against any subdomain.

test("home page renders", async ({ page }) => {
  // A church with no home page sends / on to the member app (/mobile); both render an h1.
  const res = await page.goto("/");
  expect(res?.status() ?? 200).toBeLessThan(400);
  await expect(page.locator("html")).not.toHaveAttribute("id", "__next_error__");
  await expectHeading(page);
});

test("login page renders and reaches the API", async ({ page }) => {
  const providers = page.waitForResponse((r) => /\/membership\/users\/sso\/providers/.test(r.url()), { timeout: 30000 });
  await page.goto("/login");
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  expect((await providers).status()).toBeLessThan(400);
});

// The API path is the request that proves the page loaded the church's own data.
const ROUTES: { name: string; path: string; api: RegExp }[] = [
  { name: "Sermons", path: "/sermons", api: /\/content\/sermons\/public\/[^/]+$/ },
  { name: "Donate", path: "/donate", api: /\/giving\/(donate\/gateways|campaigns\/churchId)\/[^/]+$/ },
  { name: "Groups", path: "/groups", api: /\/membership\/groups\/public\/[^/]+\/list$/ }
];

for (const r of ROUTES) {
  test(`${r.name} page loads`, async ({ page }) => {
    await openAndLoad(page, r.path, r.api);
    await expect(page).toHaveURL(new RegExp(r.path));
    await expectHeading(page);
  });
}
