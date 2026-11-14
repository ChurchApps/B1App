import { test, expect, request, type Page } from "@playwright/test";
import { mobileSignedInChrome } from "./helpers/mobile";
import { DEMO_CHURCH, SEED_PEOPLE } from "./helpers/fixtures";

const SAFE_TOP = 62;

// /mobile entry point: greeting, latest sermon, verse of the day, "More from" pills, More page, notifications

test.describe("Mobile shell", () => {
  test("/mobile redirects to /mobile/dashboard", async ({ page }) => {
    await page.goto("/mobile");
    await expect(page).toHaveURL(/\/mobile\/dashboard/);
  });

  test("dashboard shows logged-in chrome (profile avatar)", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
  });

  test("unknown mobile slug renders a not-found card with a way home", async ({ page }) => {
    await page.goto("/mobile/this-screen-does-not-exist");
    await expect(page.locator("main")).toContainText(/Page not found/i, { timeout: 15000 });
    await expect(page.locator("main")).not.toContainText(/coming soon|not yet implemented/i);
    await page.locator("main").getByRole("link", { name: /Back to home/i }).click();
    await expect(page).toHaveURL(/\/mobile\/dashboard/, { timeout: 15000 });
  });

  test("More page footer shows the church name, not a product name", async ({ page }) => {
    await page.goto("/mobile/more");
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: /Privacy Policy/i })).toBeVisible({ timeout: 15000 });
    await expect(main).toContainText(DEMO_CHURCH.NAME);
    await expect(main).not.toContainText(/B1 Mobile Web/i);
  });

  test("Me screen titles itself with the signed-in person", async ({ page }) => {
    await page.goto("/mobile/me");
    await expect(page.getByRole("heading", { level: 1 }).filter({ visible: true }).first()).toHaveText(SEED_PEOPLE.DEMO, { timeout: 15000 });
  });

  test("app bar shows the church name", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.locator("header:visible").first()).toContainText(DEMO_CHURCH.NAME);
  });

  test("app bar exposes notifications bell and profile avatar", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.getByRole("button", { name: /Notifications/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /^Profile$/i })).toBeVisible();
  });

  test("dashboard teases giving in place of a Give pill", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    const giving = page.getByRole("region", { name: /^Giving$/i });
    await expect(giving).toBeVisible({ timeout: 15000 });
    await expect(giving.getByRole("link", { name: "Give" })).toHaveAttribute("href", "/mobile/donate?view=give");
    await expect(page.getByRole("region", { name: new RegExp(`More from ${DEMO_CHURCH.NAME}`, "i") }).getByRole("link", { name: "Give" })).toHaveCount(0);
  });

  test("dashboard renders the Verse of the Day section", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(page.getByRole("region", { name: /Verse of the Day/i })).toBeVisible({ timeout: 15000 });
  });

  test("dashboard teases the latest sermon with a link to all sermons", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    const sermon = page.getByRole("region", { name: /Latest sermon/i });
    await expect(sermon).toBeVisible({ timeout: 15000 });
    await sermon.getByRole("link", { name: /All sermons/i }).click();
    await expect(page).toHaveURL(/\/mobile\/sermons/, { timeout: 15000 });
  });

  test("More page lists the church's links", async ({ page }) => {
    await page.goto("/mobile/more");
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: /Bible/i })).toBeVisible({ timeout: 15000 });
    await expect(main.getByRole("link", { name: /Sermons/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /Live/i })).toBeVisible();
  });

  test("clicking profile avatar navigates to profile edit", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await page.getByRole("button", { name: /^Profile$/i }).click();
    await expect(page).toHaveURL(/\/mobile\/profileEdit/, { timeout: 15000 });
  });

  // iOS 27 Liquid Glass chrome covers the top of the screen. The app bar and the
  // More page profile must sit in a content safe zone driven by --safe-top so a
  // non-zero top inset actually moves them.
  test.describe("content safe zone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("app bar and More page profile clear a 62px top safe inset", async ({ page }) => {
      await page.goto("/mobile/dashboard");
      const brand = page.locator("header:visible").getByText(DEMO_CHURCH.NAME);
      await expect(brand).toBeVisible({ timeout: 15000 });

      await applySafeTop(page);

      const brandBox = await brand.boundingBox();
      expect(brandBox, "app bar brand should be laid out").not.toBeNull();
      expect(
        brandBox!.y,
        `app bar brand y=${brandBox!.y} sits inside the ${SAFE_TOP}px top safe zone`
      ).toBeGreaterThanOrEqual(SAFE_TOP - 1);

      // Client-side nav keeps the injected inset.
      await page.getByRole("navigation", { name: /Main navigation/i }).getByRole("link", { name: /^More$/ }).click();
      await expect(page).toHaveURL(/\/mobile\/more/, { timeout: 15000 });
      const main = page.locator("main");
      await expect(main.getByRole("link", { name: /Edit Profile/i })).toBeVisible({ timeout: 10000 });

      const profileBox = await main.getByText(SEED_PEOPLE.DEMO, { exact: true }).boundingBox();
      expect(profileBox, "More page profile name should be laid out").not.toBeNull();
      expect(
        profileBox!.y,
        `More page profile y=${profileBox!.y} sits inside the ${SAFE_TOP}px top safe zone`
      ).toBeGreaterThanOrEqual(SAFE_TOP - 1);
    });
  });
});

// Issue #1119: in dark mode the theme toggle rendered the raw key
// "mobile.components.lightMode". Light mode hid the bug — "darkMode" already existed.
test.describe("Mobile shell dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("the More page theme toggle offers a translated switch back to light mode", async ({ page }) => {
    // MobileThemeProvider prefers a stored mode over prefers-color-scheme, so clear it.
    await page.addInitScript(() => { try { window.localStorage.removeItem("b1mobile.theme"); } catch { } });
    await page.goto("/mobile/more");

    const toggle = page.locator("main").getByRole("button", { name: "Switch to light mode", exact: true });
    await expect(toggle).toBeVisible({ timeout: 15000 });
    await expect(toggle).toContainText("Light Mode");
    await expect(toggle).toHaveAccessibleName("Switch to light mode");
    await expect(page.locator("main"), '"mobile.components.lightMode" must never render as literal text').not.toContainText("mobile.components.");
  });
});

// Issue #1189: a church can hide the anonymous home-screen sign-in prompt or change its wording
// from B1Admin's B1 Mobile page. Both are public Membership settings read through config.appearance.
const API_BASE = process.env.API_BASE || "http://localhost:8084";
const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";
const DEFAULT_PROMPT = "Sign in to see your groups, giving, and more.";

async function setSignInPrompt(hide: boolean, text: string) {
  const ctx = await request.newContext();
  const login = await ctx.post(API_BASE + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const body = await login.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID);
  const headers = { Authorization: `Bearer ${uc?.jwt}` };
  const all = await (await ctx.get(API_BASE + "/membership/settings", { headers })).json();
  const row = (keyName: string, value: string) => ({ ...((all as any[]).find(s => s.keyName === keyName) || { churchId: DEMO_CHURCH.ID, keyName }), public: 1, value });
  const res = await ctx.post(API_BASE + "/membership/settings", { headers, data: [row("mobileHideSignInPrompt", `${hide}`), row("mobileSignInPromptText", text)] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  await ctx.post(BASE_URL + "/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
  await ctx.dispose();
}

test.describe("Mobile dashboard sign-in prompt", () => {
  // These change a church-wide setting the anonymous dashboard reads.
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 390, height: 844 } });
  test.afterAll(async () => { await setSignInPrompt(false, ""); });

  // The Sign in button sits under the welcome title; the More and Me tabs have their own Sign In links.
  const signInPill = (page: Page) => page.locator("main h1", { hasText: /^Welcome$/ }).locator("xpath=..").getByRole("link", { name: /^Sign in$/i });

  test("shows the default prompt and Sign in button to visitors", async ({ page }) => {
    await setSignInPrompt(false, "");
    await page.goto("/mobile/dashboard");
    await expect(page.getByText("Welcome", { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(DEFAULT_PROMPT, { exact: true })).toBeVisible();
    await expect(signInPill(page)).toBeVisible();
  });

  test("shows the church's own prompt wording", async ({ page }) => {
    await setSignInPrompt(false, "Sign in to get conference alerts");
    await page.goto("/mobile/dashboard");
    await expect(page.getByText("Sign in to get conference alerts", { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(DEFAULT_PROMPT, { exact: true })).toHaveCount(0);
    await expect(signInPill(page)).toBeVisible();
  });

  test("hides the prompt but keeps the welcome title when the church turns it off", async ({ page }) => {
    await setSignInPrompt(true, "Sign in to get conference alerts");
    await page.goto("/mobile/dashboard");
    await expect(page.getByText("Welcome", { exact: true })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(DEFAULT_PROMPT, { exact: true })).toHaveCount(0);
    await expect(page.getByText("Sign in to get conference alerts", { exact: true })).toHaveCount(0);
    await expect(signInPill(page)).toHaveCount(0);
  });
});

// Issue #1313: a church picks how photo links appear on Home (B1Admin > B1 Mobile > Home screen tiles).
// The demo church has no photo links, so the visitor's links request is answered with three.
async function setTileLayout(layout: string) {
  const ctx = await request.newContext();
  const login = await ctx.post(API_BASE + "/membership/users/login", { data: { email: "demo@b1.church", password: "password" } });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);
  const body = await login.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === DEMO_CHURCH.ID);
  const headers = { Authorization: `Bearer ${uc?.jwt}` };
  const all = await (await ctx.get(API_BASE + "/membership/settings", { headers })).json();
  const row = { ...((all as any[]).find(s => s.keyName === "mobileTileLayout") || { churchId: DEMO_CHURCH.ID, keyName: "mobileTileLayout" }), public: 1, value: layout };
  const res = await ctx.post(API_BASE + "/membership/settings", { headers, data: [row] });
  if (!res.ok()) throw new Error(`settings save failed: ${res.status()}`);
  await ctx.post(BASE_URL + "/api/revalidate/" + DEMO_CHURCH.SUBDOMAIN);
  await ctx.dispose();
}

const PHOTO_LINKS = [
  { id: "TILE1", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "sermons", text: "Watch Sermons", sort: 1, photo: "/images/group.jpg", visibility: "everyone" },
  { id: "TILE2", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "bible", text: "Read the Bible", sort: 2, photo: "/images/group.jpg", visibility: "everyone" },
  { id: "TILE3", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "stream", text: "Join Live", sort: 3, photo: "/images/group.jpg", visibility: "everyone" }
];

test.describe("Mobile dashboard tile layout", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 390, height: 844 } });
  test.afterAll(async () => { await setTileLayout("grid"); });

  const openDashboard = async (page: Page) => {
    await page.route(/\/links\/church\/[^/]+\?category=b1Tab/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PHOTO_LINKS) }));
    await page.goto("/mobile/dashboard");
    await expect(page.locator("main").getByText("Watch Sermons", { exact: true }).first()).toBeVisible({ timeout: 30000 });
  };

  test("keeps the photo grid by default", async ({ page }) => {
    await setTileLayout("grid");
    await openDashboard(page);
    const main = page.locator("main");
    for (const l of PHOTO_LINKS) await expect(main.getByRole("link", { name: l.text, exact: true }).first()).toBeVisible();
    await expect(main.locator(".kit-row", { hasText: "Read the Bible" })).toHaveCount(0);
  });

  test("shows photo links as a list when the church picks List", async ({ page }) => {
    await setTileLayout("list");
    await openDashboard(page);
    const main = page.locator("main");
    await expect(page.getByTestId("home-tile-grid")).toHaveCount(0);
    for (const l of PHOTO_LINKS) await expect(main.locator(".kit-row", { hasText: l.text })).toBeVisible();
    await expect(main.locator(".kit-row", { hasText: "Read the Bible" })).toHaveAttribute("href", /\/mobile\/bible/);
    await expect(main.locator(".kit-row", { hasText: "Read the Bible" }).locator("img")).toHaveCount(1);
  });

  test("shows photo links in one sideways-scrolling row when the church picks Scrolling row", async ({ page }) => {
    await setTileLayout("scroll");
    await openDashboard(page);
    const row = page.getByTestId("home-tile-scroll");
    await expect(row).toBeVisible();
    await expect(row.getByRole("link")).toHaveCount(3);
    const boxes = await Promise.all((await row.getByRole("link").all()).map(l => l.boundingBox()));
    expect(new Set(boxes.map(b => Math.round(b!.y))).size).toBe(1);
  });

  // ChurchAppsSupport#1454: the row keeps moving forward and wraps to the first tile instead of sliding back,
  // with one dot per tile under it and the current one marked.
  test("moves the tile row on its own and wraps forward to the first tile when the church picks Scrolling (automatic)", async ({ page }) => {
    test.setTimeout(90000);
    await setTileLayout("autoscroll");
    await openDashboard(page);
    const row = page.getByTestId("home-tile-scroll");
    await expect(row.getByRole("link")).toHaveCount(3);
    const dots = page.getByTestId("home-tile-scroll-dots").getByRole("button");
    await expect(dots).toHaveCount(3);
    await expect(dots.first()).toHaveAttribute("aria-current", "true");
    // Every time the row moves left it should land straight on the start, never pass back over the tiles.
    await row.evaluate((el) => {
      const w = window as unknown as { stepsBack: number[] };
      w.stepsBack = [];
      let last = el.scrollLeft;
      el.addEventListener("scroll", () => { if (el.scrollLeft < last - 1) w.stepsBack.push(el.scrollLeft); last = el.scrollLeft; });
    });
    await page.mouse.move(0, 0);
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true", { timeout: 15000 });
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true", { timeout: 15000 });
    // Past the last tile it wraps to the first instead of stopping.
    await expect(dots.first()).toHaveAttribute("aria-current", "true", { timeout: 15000 });
    await expect.poll(() => row.evaluate((el) => el.scrollLeft), { timeout: 5000 }).toBeLessThan(2);
    const stepsBack = await page.evaluate(() => (window as unknown as { stepsBack: number[] }).stepsBack);
    expect(stepsBack.length).toBeGreaterThan(0);
    expect(stepsBack.every((left) => left < 2)).toBe(true);
  });

  test("keeps the tile row still under reduced motion", async ({ page }) => {
    await setTileLayout("autoscroll");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openDashboard(page);
    const row = page.getByTestId("home-tile-scroll");
    await expect(row.getByRole("link")).toHaveCount(3);
    await expect(row).toHaveAttribute("data-autoscroll", "off");
  });

  // ChurchAppsSupport#1494: the two combined layouts feature the first three photo links and list the rest
  // beneath, with an All link to the More screen.
  const FIVE_LINKS = [
    ...PHOTO_LINKS,
    { id: "TILE4", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "groups", text: "Find a Group", sort: 4, photo: "/images/group.jpg", visibility: "everyone" },
    { id: "TILE5", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "donation", text: "Give Online", sort: 5, photo: "/images/group.jpg", visibility: "everyone" }
  ];
  const openWithLinks = async (page: Page, links: object[]) => {
    await page.route(/\/links\/church\/[^/]+\?category=b1Tab/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(links) }));
    await page.goto("/mobile/dashboard");
    await expect(page.locator("main").getByText("Watch Sermons", { exact: true }).first()).toBeVisible({ timeout: 30000 });
  };
  const tileSection = (page: Page) => page.getByTestId("home-tiles-section");

  test("features three photo links as a grid and lists the rest when the church picks Grid and list", async ({ page }) => {
    await setTileLayout("gridlist");
    await openWithLinks(page, FIVE_LINKS);
    const grid = page.getByTestId("home-tile-grid");
    await expect(grid.getByRole("link")).toHaveCount(3);
    for (const name of ["Watch Sermons", "Read the Bible", "Join Live"]) await expect(grid.getByRole("link", { name, exact: true })).toBeVisible();
    const list = page.getByTestId("home-tile-list");
    await expect(list.locator(".kit-row")).toHaveCount(2);
    await expect(list.locator(".kit-row", { hasText: "Find a Group" })).toBeVisible();
    await expect(list.locator(".kit-row", { hasText: "Give Online" })).toBeVisible();
    const all = tileSection(page).getByRole("link", { name: "All", exact: true });
    await expect(all).toHaveAttribute("href", /\/mobile\/more/);
    await all.click();
    await expect(page).toHaveURL(/\/mobile\/more/, { timeout: 15000 });
  });

  // ChurchAppsSupport#1545: the moving row carries every photo link (so it moves on wide screens too).
  // ChurchAppsSupport#1573: the list beneath skips links already in the tab bar, here the first three.
  test("moves every photo link and lists the ones not in the tab bar beneath when the church picks Scrolling (automatic) and list", async ({ page }) => {
    await setTileLayout("autoscrolllist");
    await openWithLinks(page, FIVE_LINKS);
    await expect(page.getByTestId("home-tile-scroll").getByRole("link")).toHaveCount(5);
    await expect(page.getByTestId("home-tile-scroll-dots").getByRole("button")).toHaveCount(5);
    const list = page.getByTestId("home-tile-list");
    const rows = list.locator(".kit-row");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("Find a Group");
    await expect(rows.nth(1)).toContainText("Give Online");
    for (const name of ["Watch Sermons", "Read the Bible", "Join Live"]) await expect(list.locator(".kit-row", { hasText: name })).toHaveCount(0);
    await expect(tileSection(page).getByRole("link", { name: "All", exact: true })).toHaveAttribute("href", /\/mobile\/more/);
  });

  // ChurchAppsSupport#1573: on wide screens the header carries five links, so the list beneath the row starts at the sixth.
  test.describe("on a wide screen", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("lists only the photo links not in the header beneath the moving row in Scrolling (automatic) and list", async ({ page }) => {
      const SIX_LINKS = [
        ...FIVE_LINKS,
        { id: "TILE6", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "checkin", text: "Check In", sort: 6, photo: "/images/group.jpg", visibility: "everyone" }
      ];
      await setTileLayout("autoscrolllist");
      await openWithLinks(page, SIX_LINKS);
      await expect(page.getByTestId("home-tile-scroll").getByRole("link")).toHaveCount(6);
      const rows = page.getByTestId("home-tile-list").locator(".kit-row");
      await expect(rows).toHaveCount(1);
      await expect(rows.first()).toContainText("Check In");
    });
  });

  // ChurchAppsSupport#1573: "More from" pills skip the links already in the menu on screen,
  // the five header links on md+ and the three tab-bar links on a phone.
  const SIX_PILL_LINKS = [
    { id: "PILL1", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "directory", text: "Member Directory", sort: 1, visibility: "everyone" },
    { id: "PILL2", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "checkin", text: "Check In", sort: 2, visibility: "everyone" },
    { id: "PILL3", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "lessons", text: "Lessons", sort: 3, visibility: "everyone" },
    { id: "PILL4", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "bible", text: "Bible", sort: 4, visibility: "everyone" },
    { id: "PILL5", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "stream", text: "Live", sort: 5, visibility: "everyone" },
    { id: "PILL6", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "registrations", text: "Event Registrations", sort: 6, visibility: "everyone" }
  ];
  const openPills = async (page: Page) => {
    await page.route(/\/links\/church\/[^/]+\?category=b1Tab/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SIX_PILL_LINKS) }));
    await page.goto("/mobile/dashboard");
    const pills = page.getByRole("region", { name: new RegExp(`More from ${DEMO_CHURCH.NAME}`, "i") });
    await expect(pills.getByRole("link", { name: "Event Registrations", exact: true })).toBeVisible({ timeout: 30000 });
    return pills;
  };

  test.describe("pills on a wide screen", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("skips all five header links in the More from pills", async ({ page }) => {
      const pills = await openPills(page);
      for (const name of ["Member Directory", "Check In", "Lessons", "Bible", "Live"]) await expect(pills.getByRole("link", { name, exact: true })).toHaveCount(0);
    });
  });

  test("skips only the three tab-bar links in the More from pills on a phone", async ({ page }) => {
    const pills = await openPills(page);
    await expect(pills.getByRole("link", { name: "Member Directory", exact: true })).toHaveCount(0);
    await expect(pills.getByRole("link", { name: "Bible", exact: true })).toBeVisible();
  });

  // ChurchAppsSupport#1545: the list under the grid stops at three rows; All opens the rest.
  test("lists at most three photo links under the grid in Grid and list", async ({ page }) => {
    const SEVEN_LINKS = [
      ...FIVE_LINKS,
      { id: "TILE6", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "groups", text: "Serve Team", sort: 6, photo: "/images/group.jpg", visibility: "everyone" },
      { id: "TILE7", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "donation", text: "Summer Camp", sort: 7, photo: "/images/group.jpg", visibility: "everyone" }
    ];
    await setTileLayout("gridlist");
    await openWithLinks(page, SEVEN_LINKS);
    await expect(page.getByTestId("home-tile-grid").getByRole("link")).toHaveCount(3);
    const list = page.getByTestId("home-tile-list");
    await expect(list.locator(".kit-row")).toHaveCount(3);
    for (const name of ["Find a Group", "Give Online", "Serve Team"]) await expect(list.locator(".kit-row", { hasText: name })).toBeVisible();
    await expect(list.locator(".kit-row", { hasText: "Summer Camp" })).toHaveCount(0);
    const all = tileSection(page).getByRole("link", { name: "All", exact: true });
    await all.click();
    await expect(page).toHaveURL(/\/mobile\/more/, { timeout: 15000 });
  });

  test("shows only the featured tiles, with no list or All link, when there are three or fewer", async ({ page }) => {
    await setTileLayout("gridlist");
    await openWithLinks(page, PHOTO_LINKS);
    await expect(page.getByTestId("home-tile-grid").getByRole("link")).toHaveCount(3);
    await expect(page.getByTestId("home-tile-list")).toHaveCount(0);
    await expect(tileSection(page).getByRole("link", { name: "All", exact: true })).toHaveCount(0);
  });

  // Issue #1315: a verse-of-the-day link with a photo is a tile like the rest, not only the verse section.
  test("shows a photo verse-of-the-day link as a tile", async ({ page }) => {
    await setTileLayout("grid");
    const links = [...PHOTO_LINKS, { id: "TILE4", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "votd", text: "Daily verse", sort: 4, photo: "/images/group.jpg", visibility: "everyone" }];
    await page.route(/\/links\/church\/[^/]+\?category=b1Tab/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(links) }));
    await page.goto("/mobile/dashboard");
    await expect(page.getByTestId("home-tile-grid").getByRole("link", { name: "Daily verse" })).toHaveAttribute("href", /\/mobile\/votd/, { timeout: 30000 });
  });
});

async function applySafeTop(page: Page) {
  await page.addStyleTag({ content: `:root, .mobileAppRoot { --safe-top: ${SAFE_TOP}px !important; --safe-bottom: 34px !important; }` });
}

// ChurchAppsSupport#1459: a Folder tab holds other tabs. Its tabs leave the tab bar, Home and More
// and show only on the folder's own screen, as photo tiles when they all have a photo.
const FOLDER_LINKS = [
  { id: "FOLD1", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "folder", text: "Portal", icon: "folder", sort: 1, visibility: "everyone" },
  { id: "FOLDC1", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "sermons", text: "Folder Sermons", parentId: "FOLD1", sort: 1, visibility: "everyone" },
  { id: "FOLDC2", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "bible", text: "Folder Bible", parentId: "FOLD1", sort: 2, visibility: "everyone" },
  { id: "FOLDC3", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "stream", text: "Folder Staff Stream", parentId: "FOLD1", sort: 3, visibility: "staff" },
  { id: "FOLD2", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "folder", text: "Empty Folder", sort: 2, visibility: "everyone" },
  { id: "TOP1", churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "votd", text: "Top Verse", sort: 3, visibility: "everyone" }
];

test.describe("Mobile tab folders", () => {
  test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 390, height: 844 } });

  const mockLinks = async (page: Page, links: object[]) => {
    await page.route(/\/links\/church\/[^/]+\?category=b1Tab/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(links) }));
  };

  test("More lists the folder but not the tabs inside it, and the folder opens to its tabs", async ({ page }) => {
    await mockLinks(page, FOLDER_LINKS);
    await page.goto("/mobile/more");
    const main = page.locator("main");
    await expect(main.getByRole("link", { name: "Top Verse" })).toBeVisible({ timeout: 30000 });
    await expect(main.getByRole("link", { name: "Portal" })).toBeVisible();
    await expect(main.getByText("Folder Sermons")).toHaveCount(0);
    // A folder with nothing visible inside is left out.
    await expect(main.getByText("Empty Folder")).toHaveCount(0);

    await main.getByRole("link", { name: "Portal" }).click();
    await expect(page).toHaveURL(/\/mobile\/folder\?id=FOLD1/, { timeout: 15000 });
    await expect(main.getByRole("heading", { level: 1, name: "Portal" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Folder Sermons" })).toHaveAttribute("href", /\/mobile\/sermons/);
    await expect(main.getByRole("link", { name: "Folder Bible" })).toHaveAttribute("href", /\/mobile\/bible/);
    // Visibility still applies inside a folder.
    await expect(main.getByText("Folder Staff Stream")).toHaveCount(0);
  });

  test("the tab bar shows the folder in place of its tabs", async ({ page }) => {
    await mockLinks(page, FOLDER_LINKS);
    await page.goto("/mobile/dashboard");
    const tabBar = page.getByRole("navigation").filter({ hasText: "Portal" }).first();
    await expect(tabBar).toBeVisible({ timeout: 30000 });
    await expect(tabBar).not.toContainText("Folder Sermons");
    await expect(tabBar).not.toContainText("Folder Bible");
  });

  test("a folder whose tabs all have photos shows them as tiles", async ({ page }) => {
    const photo = "/images/group.jpg";
    await mockLinks(page, FOLDER_LINKS.map((l) => (l.parentId ? { ...l, photo } : l)));
    await page.goto("/mobile/folder?id=FOLD1&title=Portal");
    const grid = page.getByTestId("folder-tile-grid");
    await expect(grid.getByRole("link", { name: "Folder Sermons" })).toBeVisible({ timeout: 30000 });
    await expect(grid.getByRole("link", { name: "Folder Bible" })).toBeVisible();
  });

  test("an unknown folder shows an empty state", async ({ page }) => {
    await mockLinks(page, FOLDER_LINKS);
    await page.goto("/mobile/folder?id=NOPE&title=Gone");
    await expect(page.locator("main").getByText("Nothing here yet")).toBeVisible({ timeout: 30000 });
  });
});
