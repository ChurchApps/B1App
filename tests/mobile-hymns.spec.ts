import { test, expect, type Page } from "@playwright/test";

// Hymns stays hidden until Jeremy reviews it. A direct URL must not load the hymnal or call the public API.
async function recordHymnCalls(page: Page) {
  const urls: string[] = [];
  await page.route(/\/content\/hymns(\/|$|\?)/, async (route) => {
    urls.push(route.request().url());
    return route.fulfill({ json: [] });
  });
  return urls;
}

test.describe("Mobile hymns hidden", () => {
  test("the hymns list is not available and does not call the hymns API", async ({ page }) => {
    const urls = await recordHymnCalls(page);
    await page.goto("/mobile/hymns");
    const main = page.locator("main");
    await expect(main.getByText("Page not found")).toBeVisible({ timeout: 15000 });
    await expect(main.getByRole("textbox", { name: "Search hymns" })).toHaveCount(0);
    expect(urls).toEqual([]);
  });

  test("a hymn detail URL is not available", async ({ page }) => {
    const urls = await recordHymnCalls(page);
    await page.goto("/mobile/hymns/hymn0000001");
    const main = page.locator("main");
    await expect(main.getByText("Page not found")).toBeVisible({ timeout: 15000 });
    await expect(main.getByText("Back to hymns")).toHaveCount(0);
    expect(urls).toEqual([]);
  });
});
