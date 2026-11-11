import { test, expect } from "@playwright/test";

// Mid-page section heading of the seeded Grace home page
const ANCHOR_ID = "el-ELE00000029";

const expectTargetInView = async (page: import("@playwright/test").Page) => {
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15000 }).toBeGreaterThan(100);
  const box = await page.locator(`#${ANCHOR_ID}`).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThan(page.viewportSize()!.height);
  expect(box!.y + box!.height).toBeGreaterThan(0);
};

test.describe("Issue 1003 - fragment links scroll to their target", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("loading a url with a hash leaves the target in view", async ({ page }) => {
    await page.goto(`/#${ANCHOR_ID}`);
    await expect(page.locator(`#${ANCHOR_ID}`)).toBeVisible();
    await expectTargetInView(page);
  });

  test("re-scrolls to the target when hydration loses the native jump", async ({ page }) => {
    // Delay the locale fetch so client init finishes well after load, then wipe the scroll
    // position the way a late client render does in production.
    await page.route("**/locales/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });
    await page.goto(`/#${ANCHOR_ID}`);
    await expect(page.locator(`#${ANCHOR_ID}`)).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await expectTargetInView(page);
  });
});
