import { test, expect, request, type APIRequestContext } from "@playwright/test";
import { mobileSignedInChrome } from "./helpers/mobile";
import { DEMO_CHURCH } from "./helpers/fixtures";

const API = process.env.API_BASE || "http://localhost:8084";
const BASE_URL = process.env.BASE_URL || "http://grace.localtest.me:3301";

// The demo church's nav has no Groups/Plans links, and Home only teases features the church turned on.
test.describe.serial("Mobile home teasers", () => {
  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  let linkIds: string[] = [];

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === "CHU00000001");
    headers = { Authorization: `Bearer ${uc.jwt}` };
    const saved = await (await ctx.post(`${API}/content/links`, {
      headers,
      data: [
        { churchId: "CHU00000001", category: "b1Tab", linkType: "groups", text: "Groups", sort: 20, visibility: "everyone" },
        { churchId: "CHU00000001", category: "b1Tab", linkType: "plans", text: "Plans", sort: 21, visibility: "everyone" }
      ]
    })).json();
    linkIds = saved.map((l: any) => l.id);
  });

  test.afterAll(async () => {
    for (const id of linkIds) await ctx.delete(`${API}/content/links/${id}`, { headers });
    await ctx.dispose();
  });

  test("shows serving, groups and giving previews", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    const main = page.locator("main");

    await expect(main.getByRole("heading", { name: "You're serving" })).toBeVisible({ timeout: 20000 });
    const serving = page.getByTestId("home-serving-row").first();
    await expect(serving).toContainText("Needs reply");
    await expect(serving.getByRole("button", { name: "Accept" })).toBeVisible();

    await expect(main.getByRole("heading", { name: "Your groups" })).toBeVisible();
    await expect(main.getByRole("link", { name: "All groups" })).toHaveAttribute("href", "/mobile/groups");

    await expect(page.getByTestId("home-giving-total")).toContainText(/\d/);
    await expect(page.getByTestId("home-giving-total")).toContainText(`Given in ${new Date().getFullYear()}`);
  });

  test("shows the next three upcoming events and links to the full list", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    const events = page.getByRole("region", { name: "Upcoming events" });
    await expect(events).toBeVisible({ timeout: 20000 });
    const rows = events.getByTestId("dashboard-event-row");
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeLessThanOrEqual(3);
    await expect(rows.first()).toHaveAttribute("href", /\/mobile\/groups/);

    await events.getByRole("link", { name: "All upcoming events" }).click();
    await expect(page).toHaveURL(/\/mobile\/me\?view=upcoming/, { timeout: 15000 });
    await expect(page.getByRole("button", { name: /Back to Me/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("me-item-event").first()).toBeVisible({ timeout: 15000 });
  });
});

// ChurchAppsSupport#1451: an event the member already registered for showed no status on Home's Upcoming events.
test.describe("Mobile home registered event", () => {
  test("Upcoming events tags an event the member registered for", async ({ page }) => {
    const ctx = await request.newContext();
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === DEMO_CHURCH.ID);
    const headers = { Authorization: `Bearer ${uc.jwt}` };
    const title = "Home Registered Event " + Date.now();
    // Sooner than any seeded event, so it is among the first rows on Home.
    const start = new Date(Date.now() + 20 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const created = await ctx.post(`${API}/content/events`, {
      headers,
      data: [{ churchId: DEMO_CHURCH.ID, groupId: "GRP00000030", title, description: "", start: start.toISOString(), end: end.toISOString(), allDay: false, visibility: "public", registrationEnabled: true, capacity: 100 }]
    });
    const eventId = (await created.json())[0]?.id;
    try {
      expect(eventId, "created event id").toBeTruthy();
      const reg = await ctx.post(`${API}/content/registrations/register`, { headers, data: { churchId: DEMO_CHURCH.ID, eventId, personId: uc.person?.id } });
      expect(reg.ok(), "registered the demo member").toBeTruthy();

      await page.goto("/mobile/dashboard");
      const events = page.getByRole("region", { name: "Upcoming events" });
      const row = events.getByTestId("dashboard-event-row").filter({ hasText: title });
      await expect(row).toHaveCount(1, { timeout: 20000 });
      await expect(row.getByTestId("dashboard-event-badge")).toHaveText("Registration");
    } finally {
      if (eventId) await ctx.delete(`${API}/content/events/${eventId}`, { headers });
      await ctx.dispose();
    }
  });
});

// When the church's app Home has no links yet, signed-out visitors still get the sign-in prompt.
test.describe("Mobile home signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("empty Home still shows the sign-in prompt", async ({ page }) => {
    await page.route(/\/links\/church\/[^/]+\?category=b1Tab/, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
    await page.goto("/mobile/dashboard");

    const main = page.locator("main");
    await expect(main.getByText("We're just getting set up.", { exact: false })).toBeVisible({ timeout: 20000 });
    await expect(main.getByText("Sign in to see your groups, giving, and more.")).toBeVisible();
    await expect(main.getByRole("link", { name: "Sign In" })).toBeVisible();
  });
});

// ChurchAppsSupport#1331: churches can opt in to the Me tab's My Attendance and My Forms on Home (B1Admin > B1 Mobile).
test.describe.serial("Mobile home attendance and forms", () => {
  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  let submissionId = "";

  const setHomeRecords = async (on: boolean) => {
    const all = (await (await ctx.get(`${API}/membership/settings`, { headers })).json()) as any[];
    const row = (keyName: string) => ({ ...(all.find((s) => s.keyName === keyName) || { churchId: DEMO_CHURCH.ID, keyName }), public: 1, value: `${on}` });
    const res = await ctx.post(`${API}/membership/settings`, { headers, data: [row("mobileHomeAttendance"), row("mobileHomeForms")] });
    expect(res.ok()).toBeTruthy();
    await ctx.post(`${BASE_URL}/api/revalidate/${DEMO_CHURCH.SUBDOMAIN}`);
  };

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === DEMO_CHURCH.ID);
    headers = { Authorization: `Bearer ${uc.jwt}` };
    // Demo User (PER00000082) already has seeded attendance; give them a form submission too.
    const saved = await (await ctx.post(`${API}/membership/formsubmissions`, {
      headers,
      data: [
        {
          formId: "FRM00000004",
          contentType: "form",
          contentId: "FRM00000004",
          submittedBy: "PER00000082",
          submissionDate: new Date().toISOString(),
          answers: [{ questionId: "QST00000013", value: "E2E Home Child" }, { questionId: "QST00000014", value: "(217) 555-0100" }]
        }
      ]
    })).json();
    submissionId = saved?.[0]?.id || "";
  });

  test.afterAll(async () => {
    await setHomeRecords(false);
    if (submissionId) await ctx.delete(`${API}/membership/formsubmissions/${submissionId}`, { headers });
    await ctx.dispose();
  });

  test("stays off Home until the church turns it on", async ({ page }) => {
    await setHomeRecords(false);
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    await expect(page.getByRole("region", { name: "Upcoming events" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("home-attendance-section")).toHaveCount(0);
    await expect(page.getByTestId("home-forms-section")).toHaveCount(0);
  });

  test("shows the member's attendance and forms on Home when turned on", async ({ page }) => {
    await setHomeRecords(true);
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();

    const attendance = page.getByTestId("home-attendance-section");
    await expect(attendance).toBeVisible({ timeout: 20000 });
    await expect(attendance.getByRole("heading", { name: "My Attendance" })).toBeVisible();
    await expect(attendance.getByText(/times? in the last 90 days/)).toBeVisible();
    await expect(attendance.getByTestId("home-attendance-row").first()).toBeVisible();
    await expect(attendance.getByRole("link", { name: "History" })).toHaveAttribute("href", "/mobile/myAttendance");

    const forms = page.getByTestId("home-forms-section");
    await expect(forms).toBeVisible();
    await expect(forms.getByRole("heading", { name: "My Forms" })).toBeVisible();
    await expect(forms.getByTestId("home-form-row").filter({ hasText: "VBS Registration (Public)" }).first()).toBeVisible();
    await forms.getByRole("link", { name: "All forms" }).click();
    await expect(page).toHaveURL(/\/mobile\/myForms/, { timeout: 15000 });
  });
});

// ChurchAppsSupport#1470: churches can show their latest blog posts as a sliding News strip on Home (B1Admin > Member portal).
test.describe.serial("Mobile home news", () => {
  test.use({ reducedMotion: "reduce" });
  const RUN = Date.now().toString(36);
  const PICNIC = { title: "Church Picnic Sign-ups", slug: `church-picnic-${RUN}`, category: "Announcements", excerpt: "Sign up by Friday.", content: "Join us after the second service. **Bring a side dish** to share.", photo: "/images/about-bg.jpg" };
  const BAPTISM = { title: "Baptism Sunday", slug: `baptism-sunday-${RUN}`, category: "Announcements", excerpt: "Celebrate with us.", content: "Talk to Pastor Donald Clark to be baptized.", photo: "/images/connect-bg.png" };
  const DEVOTION = { title: "Rest for the Weary", slug: `rest-for-the-weary-${RUN}`, category: "Devotionals", excerpt: "A short devotion.", content: "Come to me, all who labor.", photo: "" };
  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  let postIds: string[] = [];

  const setHomeNews = async (on: boolean, category = "") => {
    const all = (await (await ctx.get(`${API}/membership/settings`, { headers })).json()) as any[];
    const row = (keyName: string, value: string) => ({ ...(all.find((s) => s.keyName === keyName) || { churchId: DEMO_CHURCH.ID, keyName }), public: 1, value });
    const res = await ctx.post(`${API}/membership/settings`, { headers, data: [row("mobileHomeNews", `${on}`), row("mobileHomeNewsCategory", category)] });
    expect(res.ok()).toBeTruthy();
    await ctx.post(`${BASE_URL}/api/revalidate/${DEMO_CHURCH.SUBDOMAIN}`);
  };

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === DEMO_CHURCH.ID);
    headers = { Authorization: `Bearer ${uc.jwt}` };
    // Newest first: the devotion is the latest post, so the category filter has something to drop.
    const posts = [DEVOTION, BAPTISM, PICNIC].map(({ photo, ...p }, i) => ({ ...p, photoUrl: photo ? `${BASE_URL}${photo}` : "", publishDate: new Date(Date.now() - (i + 1) * 3600000).toISOString() }));
    const saved = await (await ctx.post(`${API}/content/posts`, { headers, data: posts })).json();
    postIds = saved.map((p: any) => p.id);
  });

  test.afterAll(async () => {
    await setHomeNews(false);
    for (const id of postIds) await ctx.delete(`${API}/content/posts/${id}`, { headers });
    await ctx.dispose();
  });

  test("stays off Home until the church turns it on", async ({ page }) => {
    await setHomeNews(false);
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    await expect(page.getByRole("region", { name: "Upcoming events" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("home-news-section")).toHaveCount(0);
  });

  test("shows the latest posts as News cards that open the full post", async ({ page }) => {
    await setHomeNews(true);
    await page.goto("/mobile/dashboard");

    const news = page.getByRole("region", { name: "News" });
    await expect(news).toBeVisible({ timeout: 20000 });
    await expect(news.getByRole("button", { name: /Rest for the Weary/ })).toBeVisible();
    await expect(news.getByRole("button", { name: /Baptism Sunday/ })).toBeAttached();
    await expect(news.getByRole("button", { name: /Church Picnic Sign-ups/ })).toBeAttached();

    await news.getByRole("button", { name: /Rest for the Weary/ }).click();
    const sheet = page.getByRole("dialog", { name: "Rest for the Weary" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Come to me, all who labor.")).toBeVisible();
    await expect(sheet.getByRole("link", { name: "View on website" })).toHaveAttribute("href", `/blog/${DEVOTION.slug}`);
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toBeHidden();

    await news.getByRole("link", { name: "All news" }).click();
    await expect(page).toHaveURL(/\/mobile\/news$/, { timeout: 15000 });
    const rows = page.getByTestId("news-row");
    await expect(rows.filter({ hasText: "Church Picnic Sign-ups" })).toBeVisible({ timeout: 20000 });
    await rows.filter({ hasText: "Church Picnic Sign-ups" }).click();
    await expect(page).toHaveURL(new RegExp(`/mobile/news/${PICNIC.slug}$`), { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Church Picnic Sign-ups" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Bring a side dish")).toBeVisible();
  });

  test("shows only the chosen blog category", async ({ page }) => {
    await setHomeNews(true, "Announcements");
    await page.goto("/mobile/dashboard");

    const news = page.getByRole("region", { name: "News" });
    await expect(news.getByRole("button", { name: /Baptism Sunday/ })).toBeVisible({ timeout: 20000 });
    await expect(news.getByRole("button", { name: /Rest for the Weary/ })).toHaveCount(0);

    await page.goto("/mobile/news");
    await expect(page.getByTestId("news-row").filter({ hasText: "Church Picnic Sign-ups" })).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId("news-row").filter({ hasText: "Rest for the Weary" })).toHaveCount(0);
  });
});

// ChurchAppsSupport#1503: a church can put Requests and Registrations on Home from Mobile Navigation.
test.describe.serial("Mobile home requests and registrations tabs", () => {
  // Phone width: the tab bar holds three links, so these two stay Home pills (on md+ the header's five would take Room Requests).
  test.use({ viewport: { width: 390, height: 844 } });
  let ctx: APIRequestContext;
  let headers: Record<string, string>;
  let linkIds: string[] = [];

  test.beforeAll(async () => {
    ctx = await request.newContext();
    const login = await (await ctx.post(`${API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } })).json();
    const uc = login.userChurches.find((c: any) => c.church?.id === DEMO_CHURCH.ID);
    headers = { Authorization: `Bearer ${uc.jwt}` };
    const saved = await (await ctx.post(`${API}/content/links`, {
      headers,
      data: [
        { churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "requests", text: "Room Requests", sort: 22, visibility: "visitors" },
        { churchId: DEMO_CHURCH.ID, category: "b1Tab", linkType: "registrations", text: "Event Registrations", sort: 23, visibility: "visitors" }
      ]
    })).json();
    linkIds = saved.map((l: any) => l.id);
  });

  test.afterAll(async () => {
    for (const id of linkIds) await ctx.delete(`${API}/content/links/${id}`, { headers });
    await ctx.dispose();
  });

  test("a Requests tab on Home opens My Requests", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    const requests = page.locator("main").getByRole("link", { name: "Room Requests" }).first();
    await expect(requests).toBeVisible({ timeout: 20000 });
    await expect(requests).toHaveAttribute("href", "/mobile/myRequests");
    await requests.click();
    await expect(page).toHaveURL(/\/mobile\/myRequests/, { timeout: 15000 });
    await expect(page.getByRole("link", { name: "Request an Event" })).toBeVisible({ timeout: 15000 });
  });

  test("a Registrations tab on Home opens Registrations", async ({ page }) => {
    await page.goto("/mobile/dashboard");
    await expect(mobileSignedInChrome(page)).toBeVisible();
    const registrations = page.locator("main").getByRole("link", { name: "Event Registrations" }).first();
    await expect(registrations).toBeVisible({ timeout: 20000 });
    await registrations.click();
    await expect(page).toHaveURL(/\/mobile\/registrations/, { timeout: 15000 });
  });
});
