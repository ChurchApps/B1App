import { test, expect, type Page } from "@playwright/test";

// The content hymns API is stubbed so the spec does not need a hymns row in the demo database.
const HYMN = {
  id: "hymn0000001",
  number: 12,
  title: "Abide With Me",
  language: "English",
  category: "Worship",
  verses: [{ order: 1, text: "UniqueVerseLine" }],
  published: true,
  archived: false
};

async function stubHymns(page: Page) {
  const urls: string[] = [];
  // Match only the content API (…/content/hymns…), never the app's own /mobile/hymns pages.
  await page.route(/\/content\/hymns(\/|$|\?)/, async (route) => {
    const request = route.request();
    if (request.method() !== "GET") return route.continue();
    const url = request.url();
    urls.push(url);
    const pathname = new URL(url).pathname;
    if (pathname.endsWith(`/${HYMN.id}`)) return route.fulfill({ json: HYMN });
    if (pathname.includes("/hymns/public/")) return route.fulfill({ json: [HYMN] });
    return route.fulfill({ json: [] });
  });
  return urls;
}

test.describe("Mobile hymns", () => {
  test("hymns list loads from the public hymns endpoint", async ({ page }) => {
    const urls = await stubHymns(page);
    await page.goto("/mobile/hymns");
    const main = page.locator("main");
    await expect(main.getByText("Abide With Me")).toBeVisible({ timeout: 15000 });
    await expect(main.getByText("12", { exact: true })).toBeVisible();
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => url.includes("/hymns/public/"))).toBe(true);
  });

  test("search matches verse text and shows an empty state", async ({ page }) => {
    await stubHymns(page);
    await page.goto("/mobile/hymns");
    const main = page.locator("main");
    await expect(main.getByText("Abide With Me")).toBeVisible({ timeout: 15000 });
    const search = page.getByRole("textbox", { name: "Search hymns" });
    await search.fill("UniqueVerseLine");
    await expect(main.getByText("Abide With Me")).toBeVisible();
    await search.fill("zzzz-no-hymn");
    await expect(main.getByText("No hymns found")).toBeVisible();
    await expect(main.getByText("Abide With Me")).toHaveCount(0);
  });

  test("opening a hymn shows its verses and a back link to /mobile/hymns", async ({ page }) => {
    await stubHymns(page);
    await page.goto("/mobile/hymns");
    const main = page.locator("main");
    await main.getByRole("link", { name: /Abide With Me/ }).click({ timeout: 15000 });
    await expect(main.getByText("UniqueVerseLine")).toBeVisible({ timeout: 15000 });
    const back = main.getByRole("link", { name: /Back to hymns/ });
    await expect(back).toBeVisible();
    const href = await back.getAttribute("href");
    expect(new URL(href || "", page.url()).pathname).toBe("/mobile/hymns");
  });

  test("favorite button toggles its accessible name", async ({ page }) => {
    await stubHymns(page);
    await page.goto("/mobile/hymns");
    await page.getByRole("button", { name: "Add Abide With Me to favorites" }).click({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Remove Abide With Me from favorites" })).toBeVisible();
  });
});
