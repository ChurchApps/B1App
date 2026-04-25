import { test, expect } from "@playwright/test";

// /groups/[label] lists groups whose label/tag matches. /groups/details/[slug]
// is the per-group public page (visitor view shows group info; member view
// shows tabs). Group slugs are seeded in membership/demo.sql:259 — e.g.
// 'youth-group' for GRP00000013, 'adult-bible-class' for GRP00000004.

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
    await expect(body).toContainText(/Youth Group|Middle School|High School/i, { timeout: 15000 });
  });

  test("renders small-group label heading", async ({ page }) => {
    await page.goto("/groups/small-group");
    await expect(page.locator("h1").filter({ hasText: /Small Group/i })).toBeVisible();
  });

  test("unknown label still renders a heading without crashing", async ({ page }) => {
    await page.goto("/groups/nonexistent-label");
    await expect(page.locator("h1").filter({ hasText: /Nonexistent Label Groups/i })).toBeVisible();
  });

  test("group detail page loads for a seeded group slug", async ({ page }) => {
    await page.goto("/groups/details/youth-group");
    await expect(page.locator("body")).toContainText(/Youth Group/i, { timeout: 15000 });
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });
});
