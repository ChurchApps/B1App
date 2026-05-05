import { test, expect } from "@playwright/test";

// /groups/[label] lists groups whose label/tag matches.
//
// /mobile/groups/[idOrSlug] is the canonical group page for both anonymous
// visitors (AnonymousGroupView with hero, about, leaders, upcoming events,
// contact form) and authenticated users (full tabbed view). The deprecated
// /groups/details/[slug] page was removed; the route accepts either the
// group id (e.g. GRP00000004) or the slug (e.g. adult-bible-class).
//
// Group slugs are seeded in membership/demo.sql:259 — e.g. 'youth-group'
// for GRP00000013, 'adult-bible-class' for GRP00000004.

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

  test("anonymous group page loads via slug", async ({ page }) => {
    await page.goto("/mobile/groups/youth-group");
    await expect(page.locator("body")).toContainText(/Youth Group/i, { timeout: 15000 });
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("anonymous group page loads via id", async ({ page }) => {
    // Same group as above (GRP00000013) but accessed by id; slug-or-id
    // resolution in AnonymousGroupView should hit the public-by-id endpoint.
    await page.goto("/mobile/groups/GRP00000013");
    await expect(page.locator("body")).toContainText(/Youth Group/i, { timeout: 15000 });
    await expect(page.locator("body")).not.toContainText(/404|not found/i);
  });

  test("anonymous visitor sees contact form on group with a leader", async ({ page }) => {
    // GRP00000004 (Adult Bible Class, slug 'adult-bible-class') has John
    // Smith (PER00000001) seeded as leader (membership/demo.sql:301), so
    // AnonymousGroupView renders the GroupContact form. Fields use
    // group-contact-* data-testids per components/groups/GroupContact.tsx.
    await page.goto("/mobile/groups/adult-bible-class");
    await expect(page.locator('[data-testid="group-contact-first-name-input"]')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('[data-testid="group-contact-last-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-contact-email-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-contact-message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="group-contact-submit-button"]')).toBeVisible();
  });

  test("anonymous view does not show authed tabs", async ({ page }) => {
    // AnonymousGroupView is a flat layout, not the tabbed AuthenticatedGroupDetail.
    // Members/Events/Resources tabs should NOT be present for logged-out visitors.
    await page.goto("/mobile/groups/adult-bible-class");
    await expect(page.locator("body")).toContainText(/Adult Bible Class/i, { timeout: 15000 });
    await expect(page.getByRole("tab", { name: /Members/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /Events/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /Resources/i })).toHaveCount(0);
  });
});
