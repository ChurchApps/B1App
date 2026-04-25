import { test, expect } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// The home page (/) renders PAG00000001 from content/demo.sql with hero,
// service times, ministries, sermons, calendar, FAQ, and contact sections.
// Anonymous access — clear cookies before each test.

test.describe("Public home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("renders hero with church name and welcome heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1, h2").filter({ hasText: /Welcome to/i }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText(DEMO_CHURCH.NAME);
  });

  test("shows seeded service times", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    await expect(body).toContainText(/Sunday Service Times/i);
    await expect(body).toContainText(/9:00 AM/);
  });

  test("shows seeded ministries section", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    await expect(body).toContainText(/Children's Ministry/i);
    await expect(body).toContainText(/Youth Ministry/i);
    await expect(body).toContainText(/Small Groups/i);
  });

  test("shows latest sermons section with seeded sermon titles", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/Latest Sermons/i);
  });

  test("shows pastor section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/Pastor John/i);
  });

  test("shows login chip in anonymous header", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="login-chip"]')).toBeVisible();
  });
});
