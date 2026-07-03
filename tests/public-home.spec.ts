import { test, expect } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

test.describe("Public home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("renders hero with welcome heading", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("h1").filter({ hasText: /Welcome.*Grace Community Church/i }).first()
    ).toBeVisible();
  });

  test("header shows church name as homepage link", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Go to homepage/i })).toContainText(DEMO_CHURCH.NAME);
  });

  test("shows seeded service times", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    await expect(body).toContainText(/Sunday Services|Service Times/i);
    await expect(body).toContainText(/9:00 & 11:00 AM/);
  });

  test("shows seeded ministries section", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    await expect(body).toContainText(/Children/i);
    await expect(body).toContainText(/Youth/i);
    await expect(body).toContainText(/Small Groups/i);
  });

  test("shows latest sermons section heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/Browse All Sermons/i);
  });

  test("shows pastor section", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("body")).toContainText(/Pastor John/i);
  });

  test("shows login link in anonymous header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Login to your account/i })).toBeVisible();
  });
});
