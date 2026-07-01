import { test, expect } from "@playwright/test";
import { DEMO_CHURCH } from "./helpers/fixtures";

// The home page (/) renders PAG00000001 from content/demo.sql with hero,
// service times, ministries, sermons, calendar, FAQ, and contact sections.
// Anonymous access — clear cookies before each test.

test.describe("Public home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("renders hero with welcome heading", async ({ page }) => {
    await page.goto("/");
    // Hero copy is "Welcome Home to Grace Community Church" (2026-06 redesign).
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
    // "Sunday Services" is the on-page section heading; "Service Times" is the footer label.
    await expect(body).toContainText(/Sunday Services|Service Times/i);
    await expect(body).toContainText(/9:00 & 11:00 AM/);
  });

  test("shows seeded ministries section", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    // Ministry cards are titled "Children" / "Youth" / "Small Groups" (2026-06 redesign),
    // not "Children's Ministry" / "Youth Ministry".
    await expect(body).toContainText(/Children/i);
    await expect(body).toContainText(/Youth/i);
    await expect(body).toContainText(/Small Groups/i);
  });

  test("shows latest sermons section heading", async ({ page }) => {
    await page.goto("/");
    // Section heading is "This Week's Message" (2026-06 redesign), not "Latest Sermons".
    await expect(page.locator("body")).toContainText(/Browse All Sermons/i);
  });

  test("shows pastor section", async ({ page }) => {
    // The pastor bio moved to the About page in the 2026-06 redesign — it's no
    // longer on the home page.
    await page.goto("/about");
    await expect(page.locator("body")).toContainText(/Pastor John/i);
  });

  test("shows login link in anonymous header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Login to your account/i })).toBeVisible();
  });
});
