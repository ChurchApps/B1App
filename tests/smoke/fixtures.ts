import { test as base, expect, type Page } from "@playwright/test";

// Smoke specs run against a deployed church site. They only navigate and read.
// Every test fails on an uncaught page error or a 5xx from our own hosts (the API and the site itself).

const FIRST_PARTY = /(^|\.)(churchapps\.org|b1\.church|localtest\.me)$|^localhost$|^127\.0\.0\.1$/;

type Watch = { pageErrors: string[]; apiFailures: string[] };

export const test = base.extend<{ watch: Watch }>({
  watch: [
    async ({ page }, use) => {
      const watch: Watch = { pageErrors: [], apiFailures: [] };
      page.on("pageerror", (e) => watch.pageErrors.push(e.message));
      page.on("response", (r) => {
        const type = r.request().resourceType();
        if (type !== "xhr" && type !== "fetch") return;
        const url = new URL(r.url());
        if (FIRST_PARTY.test(url.hostname) && r.status() >= 500) watch.apiFailures.push(`${r.status()} ${r.request().method()} ${url.host}${url.pathname}`);
      });
      await use(watch);
      expect(watch.pageErrors, "uncaught page errors").toEqual([]);
      expect(watch.apiFailures, "5xx responses from our hosts").toEqual([]);
    },
    { auto: true }
  ]
});

/** Navigate and wait for the GET that proves the page pulled real data from the API. */
export async function openAndLoad(page: Page, path: string, apiPath: RegExp) {
  const data = page.waitForResponse((r) => r.request().method() === "GET" && apiPath.test(new URL(r.url()).pathname), { timeout: 30000 });
  const nav = await page.goto(path);
  expect(nav?.status() ?? 200, `${path} status`).toBeLessThan(400);
  const res = await data;
  expect(res.status(), `${res.url()} status`).toBeLessThan(400);
  await expect(page).not.toHaveURL(/\/login/);
  // Next serves its error shell with the real page re-rendered on top; a 200 alone does not rule it out.
  await expect(page.locator("html")).not.toHaveAttribute("id", "__next_error__");
}

/** First visible h1 has text. The mobile shell renders a hidden h1 for the other layout. */
export async function expectHeading(page: Page) {
  await expect(page.locator("h1").filter({ visible: true }).first()).toHaveText(/\S/);
}

export { expect };
