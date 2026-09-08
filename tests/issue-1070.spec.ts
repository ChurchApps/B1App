import { test, expect } from "@playwright/test";

// Issue #1070 — "[BUG] Register link obscured on mobile".
// On a phone-sized viewport the "Don't have an account? Register" link at the
// bottom of the login card sits underneath the fixed #login-footer bar. Even
// after scrolling to the bottom of the page the link stays covered, so it
// cannot be tapped.
test.describe("Issue 1070 - register link on the mobile login page", () => {
  test.use({
    viewport: { width: 390, height: 664 },
    storageState: { cookies: [], origins: [] }
  });

  test("register link clears the fixed footer once the page is scrolled down", async ({ page }) => {
    await page.goto("/login");

    const register = page.locator("#register-link");
    await expect(register).toBeVisible();
    await expect(page.locator("#login-footer")).toBeVisible();

    // A phone user scrolls to the bottom of the sign-in page to reach the link.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight));

    const probe = await register.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) as HTMLElement | null;
      const footer = document.getElementById("login-footer");
      const footerRect = footer ? footer.getBoundingClientRect() : null;
      return {
        linkTop: rect.top,
        linkBottom: rect.bottom,
        footerTop: footerRect ? footerRect.top : null,
        viewportHeight: window.innerHeight,
        hitId: hit ? (hit.id || hit.tagName) : null,
        covered: !(hit === el || el.contains(hit))
      };
    });

    expect(probe.footerTop, "login footer should be rendered").not.toBeNull();

    // The whole link has to be on screen...
    expect(probe.linkTop, "register link is scrolled off the top of the viewport").toBeGreaterThanOrEqual(0);
    expect(probe.linkBottom, "register link is below the bottom of the viewport").toBeLessThanOrEqual(probe.viewportHeight);

    // ...and clear of the fixed footer bar.
    expect(
      probe.linkBottom,
      `register link (bottom ${probe.linkBottom}) overlaps the fixed footer (top ${probe.footerTop})`
    ).toBeLessThanOrEqual(probe.footerTop as number);

    // A tap in the middle of the link must actually reach the link.
    expect(probe.covered, `register link is covered by "${probe.hitId}"`).toBe(false);
  });
});
