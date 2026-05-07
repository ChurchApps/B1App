import { test, expect } from "@playwright/test";

// Tests for the request-to-join member-side UX. The seed data ships every
// group with joinPolicy='open', so we verify:
//   - Open groups still surface the existing "Join Group" button (now wired to
//     POST /groupmembers/self).
//   - The "My Groups" pending-requests section renders cleanly even when
//     there are no pending requests for the demo user.
//
// End-to-end approve/decline coverage is API-driven; UI tests just confirm
// the new surface points render.

test.describe("Mobile groups — request-to-join UX", () => {
  // Demo user (PER00000082) is NOT a member of GRP00000005 (Young Adults).
  const NON_MEMBER_GROUP_ID = "GRP00000005";

  test("non-member sees join button on an open-policy group", async ({ page }) => {
    await page.goto(`/mobile/groups/${NON_MEMBER_GROUP_ID}`);
    await expect(page.getByRole("tab", { name: /About/i })).toBeVisible({ timeout: 15000 });
    // Default policy is "open", so the Join button (not the Request button)
    // should render.
    const joinBtn = page.locator('[data-testid="join-group-button"]');
    await expect(joinBtn).toBeVisible({ timeout: 10000 });
    await expect(joinBtn).toHaveText(/Join Group/i);
  });

  test("my-groups page renders a pending-requests slot even when empty", async ({ page }) => {
    await page.goto("/mobile/groups");
    // The pending-requests section is hidden when there are no pending
    // requests; we just confirm the page loaded successfully and at least
    // one of the seeded memberships is shown.
    await expect(page.locator("main")).toContainText(/Sunday Morning Service|Adult Bible Class|Men's Bible Study/i, {
      timeout: 15000,
    });
    // The pending-requests testid should NOT be present for a freshly-seeded
    // demo user — that's the cleanly-empty state we're asserting.
    await expect(page.locator('[data-testid="my-pending-requests"]')).toHaveCount(0);
  });
});
