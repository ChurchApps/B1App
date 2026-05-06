import { test, expect } from "@playwright/test";
import { SEED_NAV_LINKS } from "./helpers/fixtures";

// Navigation links are seeded with category='website' so ConfigHelper.load
// returns them via /links/church/{id}?category=website (content/demo.sql:589).
// On md+ viewports they render inline in the header; on small viewports the
// header collapses to a hamburger menu (Header.tsx:271-281).

test.describe("Public navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("anonymous user sees seeded nav links in header", async ({ page }) => {
    await page.goto("/");
    const navbar = page.locator("#navbar");
    await navbar.waitFor({ state: "visible", timeout: 15000 });
    await expect(navbar).toContainText(SEED_NAV_LINKS.HOME.text);
    await expect(navbar).toContainText(SEED_NAV_LINKS.SERMONS.text);
    await expect(navbar).toContainText(SEED_NAV_LINKS.GIVE.text);
  });

  test("clicking Sermons nav link navigates to /sermons", async ({ page }) => {
    await page.goto("/");
    const sermonsLink = page
      .locator(`#navbar a[href="${SEED_NAV_LINKS.SERMONS.url}"]`)
      .first();
    await sermonsLink.waitFor({ state: "visible", timeout: 15000 });
    await sermonsLink.click();
    await expect(page).toHaveURL(/\/sermons/);
  });

  test("login chip links to /login", async ({ page }) => {
    await page.goto("/");
    const loginChip = page.locator('[data-testid="login-chip"]');
    await expect(loginChip).toBeVisible();
    const href = await loginChip.getAttribute("href");
    expect(href).toContain("/login");
  });

  test("mobile viewport shows hamburger menu button", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible({
      timeout: 15000,
    });
  });

  test("navbar solid-state background falls back to white when navStyles is unset", async ({ page }) => {
    // /sermons isn't an overlay page, so navbar renders solid immediately.
    await page.goto("/sermons");
    const navbar = page.locator("#navbar");
    await navbar.waitFor({ state: "visible", timeout: 15000 });
    await expect(navbar).not.toHaveClass(/transparent/);
    await expect(navbar).toHaveCSS("background-color", "rgb(255, 255, 255)");
  });

  test("navStyles override applies to live nav rendering", async ({ page, request }) => {
    const API_BASE = "http://localhost:8084";
    const loginRes = await request.post(`${API_BASE}/membership/users/login`, {
      data: { email: "demo@b1.church", password: "password" },
    });
    const loginBody = await loginRes.json();
    const grace = loginBody.userChurches.find((uc: any) => uc.church.id === "CHU00000001");
    const contentJwt = grace.apis.find((a: any) => a.keyName === "ContentApi").jwt;
    const authHeaders = { Authorization: `Bearer ${contentJwt}` };

    const existing = await request.get(`${API_BASE}/content/globalStyles`, { headers: authHeaders });
    const original = (await existing.json()) as any;

    const override = {
      ...original,
      navStyles: JSON.stringify({
        solid: { backgroundColor: "#123456", linkColor: "#abcdef", linkHoverColor: "#abcdef", activeColor: "#abcdef" },
        transparent: { linkColor: null, linkHoverColor: null, activeColor: null },
      }),
    };

    try {
      const saveRes = await request.post(`${API_BASE}/content/globalStyles`, {
        data: [override],
        headers: { ...authHeaders, "Content-Type": "application/json" },
      });
      expect(saveRes.ok()).toBeTruthy();

      await page.goto("/sermons");
      const navbar = page.locator("#navbar");
      await navbar.waitFor({ state: "visible", timeout: 15000 });
      await expect(navbar).toHaveCSS("background-color", "rgb(18, 52, 86)");
    } finally {
      const restored = { ...original, navStyles: original.navStyles ?? null };
      await request.post(`${API_BASE}/content/globalStyles`, {
        data: [restored],
        headers: { ...authHeaders, "Content-Type": "application/json" },
      });
    }
  });
});
