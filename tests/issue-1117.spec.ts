import { test, expect, type Page } from "@playwright/test";

// Issue 1117: a logged-in non-member opening a group page gets a Members tab that
// never finishes loading. GET /groupmembers?groupId= is a legitimate 401 for someone
// who isn't in the group and lacks groupMembers.view, but GroupDetail only reads
// `data` off that query, so the rejected query leaves `members === null` forever and
// the three placeholder rows spin indefinitely under a "Members (0)" heading.
//
// volunteer@b1.church (Rachel Martin) is deliberately NOT a domain admin in the demo
// data (only DoingApi/Tasks/View) and is not a member of GRP00000005 (Young Adults
// Class), so she takes the 401 path. demo@b1.church and tester@b1.church are both
// domain admins and would not reproduce it.
const NON_MEMBER_GROUP_ID = "GRP00000005";

// The roster placeholders are the only circular skeletons on this screen
// (GroupDetail.tsx renders variant="circular" solely for member rows; the
// whole-page loading skeleton uses "rounded"/"text").
const ROSTER_PLACEHOLDER = ".MuiSkeleton-circular";

async function loginAs(page: Page, email: string) {
  await page.goto("/login", { timeout: 60000 });
  await page.locator('input[type="email"]').waitFor({ state: "visible", timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30000 });
}

test.describe("Issue 1117 — group page for a logged-in non-member", () => {
  // Logs in as a non-admin, so start from a clean session rather than the shared
  // demo-user storage state (demo@b1.church is a Domain Admin).
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Members tab settles instead of showing placeholders forever", async ({ page }) => {
    await loginAs(page, "volunteer@b1.church");

    await page.goto(`/mobile/groups/${NON_MEMBER_GROUP_ID}`, { timeout: 60000 });

    // Open the Members tab the same way the reporter landed on it.
    await page.getByRole("tab", { name: /^Members$/ }).click();

    // The group itself loads fine - it is only the roster request that 401s.
    await expect(page.getByText("Young Adults Class").first()).toBeVisible({ timeout: 30000 });

    // The bug: these never go away, because the errored query is indistinguishable
    // from "still fetching".
    await expect(page.locator(ROSTER_PLACEHOLDER)).toHaveCount(0, { timeout: 20000 });

    // ...and the roster area says why it is empty rather than claiming the group
    // has no members.
    await expect(page.getByText(/only visible to people in this group/i)).toBeVisible();

    // The page is usable again, so the reporter can get to the join action.
    await page.getByRole("tab", { name: /^About$/ }).click();
    await expect(page.getByTestId("join-group-button")).toBeVisible({ timeout: 15000 });
  });
});
