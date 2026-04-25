import { test, expect } from "@playwright/test";

// /groups/[label] lists groups whose label matches. Seeded groups in
// membership/demo.sql use various labels — "youth" / "small-group" /
// "worship" / etc. The label search splits hyphens to spaces.

test.describe("Public groups listing", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("renders youth group label heading", async ({ page }) => {
    await page.goto("/groups/youth");
    await expect(page.locator("h1").filter({ hasText: /Youth Groups/i })).toBeVisible();
  });

  test("lists seeded youth groups", async ({ page }) => {
    await page.goto("/groups/youth");
    const body = page.locator("body");
    // Allow time for the GroupList client component to fetch.
    await expect(body).toContainText(/Youth Group|Middle School|High School/i, { timeout: 10000 });
  });

  test("renders small-group label heading", async ({ page }) => {
    await page.goto("/groups/small-group");
    await expect(page.locator("h1").filter({ hasText: /Small Group/i })).toBeVisible();
  });

  test("unknown label still renders a heading without crashing", async ({ page }) => {
    await page.goto("/groups/nonexistent-label");
    await expect(page.locator("h1").filter({ hasText: /Nonexistent Label Groups/i })).toBeVisible();
  });
});
