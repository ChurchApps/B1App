import { test, expect, request, type APIRequestContext } from "@playwright/test";

// Browsing the public blog as the support docs describe it: category chips, tag chips,
// the "All posts" reset and the "More in <category>" section under a post.

const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const CAT = "Spec Devotions";
const OTHER_CAT = "Spec Notices";
const TAG = "spec-hope";

const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const POSTS = [
  { title: "Spec Morning Prayer", slug: "spec-morning-prayer", excerpt: "Start the day in prayer.", content: "Pray first.", category: CAT, tags: `${TAG}, spec-prayer`, authorId: "PER00000001", publishDate: day(1) },
  { title: "Spec Evening Rest", slug: "spec-evening-rest", excerpt: "End the day in rest.", content: "Rest well.", category: CAT, tags: "spec-prayer", publishDate: day(2) },
  { title: "Spec Parking Update", slug: "spec-parking-update", excerpt: "New parking lot.", content: "Park here.", category: OTHER_CAT, publishDate: day(3) }
];

type Ctx = { api: APIRequestContext; headers: Record<string, string>; ids: string[] };

async function setup(): Promise<Ctx> {
  const api = await request.newContext();
  const res = await api.post(`${MAIN_API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === "CHU00000001");
  const jwt = uc.apis.find((a: any) => a.keyName === "ContentApi")?.jwt || uc.apis[0].jwt;
  const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
  const saved = await (await api.post(`${MAIN_API}/content/posts`, { headers, data: POSTS })).json();
  return { api, headers, ids: (saved || []).map((p: any) => p.id).filter(Boolean) };
}

test.describe("Public blog — browsing by category and tag", () => {
  test.describe.configure({ mode: "serial" });
  let ctx: Ctx;

  test.beforeAll(async () => { ctx = await setup(); });
  test.afterAll(async () => {
    if (!ctx) return;
    for (const id of ctx.ids) await ctx.api.delete(`${MAIN_API}/content/posts/${id}`, { headers: ctx.headers });
  });

  test("a category chip filters the list and All posts clears it", async ({ page }) => {
    await page.goto("/blog", { timeout: 60000 });
    const titles = page.locator("article h2");
    await expect(titles.filter({ hasText: "Spec Parking Update" })).toBeVisible({ timeout: 30000 });
    // Newest first.
    const all = await titles.allInnerTexts();
    expect(all.indexOf("Spec Morning Prayer")).toBeLessThan(all.indexOf("Spec Evening Rest"));
    await expect(page.locator("article", { hasText: "Spec Morning Prayer" }).getByText(/By John Smith/)).toBeVisible();

    await page.getByRole("link", { name: OTHER_CAT, exact: true }).first().click();
    await page.waitForURL(/category=Spec(\+|%20)Notices/);
    await expect(page.getByRole("heading", { level: 1, name: OTHER_CAT })).toBeVisible();
    await expect(titles).toHaveText(["Spec Parking Update"]);

    await page.getByRole("link", { name: "All posts" }).click();
    await page.waitForURL(/\/blog$/);
    await expect(titles.filter({ hasText: "Spec Morning Prayer" })).toBeVisible();
  });

  test("a tag chip on a post filters the list to that tag", async ({ page }) => {
    await page.goto("/blog/spec-morning-prayer", { timeout: 60000 });
    await page.getByRole("link", { name: TAG, exact: true }).click();
    await page.waitForURL(new RegExp(`tag=${TAG}`));
    await expect(page.getByRole("heading", { level: 1, name: TAG })).toBeVisible();
    await expect(page.locator("article h2")).toHaveText(["Spec Morning Prayer"]);
  });

  test("a post suggests other posts from its category under More in", async ({ page }) => {
    await page.goto("/blog/spec-morning-prayer", { timeout: 60000 });
    const related = page.locator("aside");
    await expect(related.getByRole("heading", { name: `More in ${CAT}` })).toBeVisible({ timeout: 30000 });
    await expect(related.getByRole("link", { name: "Spec Evening Rest" })).toBeVisible();
    await expect(related.getByText("Spec Parking Update")).toHaveCount(0);
    await expect(related.getByText("Spec Morning Prayer")).toHaveCount(0);
  });
});
