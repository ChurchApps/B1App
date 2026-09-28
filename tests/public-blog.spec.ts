import { test, expect, request, type APIRequestContext } from "@playwright/test";

// Public blog with the RefTagger snippet saved in Appearance > CSS & JavaScript.
// Scripture links must show on a directly loaded blog post and after clicking into the
// post from /blog. <Theme> is rendered per page, so client navigation mounts it again and
// re-runs the snippet. The snippet starts with `var refTagger = { settings }`, which wipes
// the loaded library, and RefTagger.js only attaches when `refTaggerCallback` is unset
// (`e.refTaggerCallback || (e.refTagger = library)`), so nothing tags the new post.
//
// RefTagger.js is stubbed with the same attach guard so the spec doesn't depend on the
// third-party CDN.

const MAIN_API = process.env.API_BASE || "http://localhost:8084";
const SLUG = "public-blog-baptism";

const REFTAGGER_SNIPPET = `<script>
var refTagger = {
  settings: {
    bibleVersion: 'NKJV'
  }
};

(function(d, t) {
  var n=d.querySelector('[nonce]');
  refTagger.settings.nonce = n && (n.nonce||n.getAttribute('nonce'));
  var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
  g.src = 'https://api.reftagger.com/v2/RefTagger.js';
  g.nonce = refTagger.settings.nonce;
  s.parentNode.insertBefore(g, s);
}(document, 'script'));
</script>`;

const REFTAGGER_STUB = `!function(e,t){e.refTaggerCallback||(e.refTagger=t())}(this,function(){
  window.refTaggerCallback = function(){};
  var lib = {
    settings: (window.refTagger && window.refTagger.settings) || {},
    tag: function(){
      document.querySelectorAll("p").forEach(function(p){
        if (p.querySelector("a.rtBibleRef")) return;
        p.innerHTML = p.innerHTML.replace(/Matthew 28:19-20/g, '<a class="rtBibleRef" href="#">$&</a>');
      });
    }
  };
  setTimeout(function(){ lib.tag(); }, 0);
  return lib;
});`;

type Ctx = { api: APIRequestContext; headers: Record<string, string>; styleBackup: any; postId?: string };

async function setup(): Promise<Ctx> {
  const api = await request.newContext();
  const res = await api.post(`${MAIN_API}/membership/users/login`, { data: { email: "demo@b1.church", password: "password" } });
  const body = await res.json();
  const uc = (body.userChurches || []).find((c: any) => c.church?.id === "CHU00000001");
  const jwt = uc.apis.find((a: any) => a.keyName === "ContentApi")?.jwt || uc.apis[0].jwt;
  const headers = { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" };
  const styleBackup = await (await api.get(`${MAIN_API}/content/globalStyles`, { headers })).json();
  await api.post(`${MAIN_API}/content/globalStyles`, { headers, data: [{ ...styleBackup, customJS: REFTAGGER_SNIPPET }] });
  const posts = await (await api.post(`${MAIN_API}/content/posts`, {
    headers,
    data: [
      {
        title: "The Meaning of Baptism",
        slug: SLUG,
        excerpt: "Why we baptize.",
        content: "Jesus sent his disciples out in Matthew 28:19-20 to baptize the nations.",
        publishDate: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  })).json();
  return { api, headers, styleBackup, postId: posts?.[0]?.id };
}

test.describe("Public blog — custom JS after client-side navigation", () => {
  // Both tests share one post and one customJS override.
  test.describe.configure({ mode: "serial" });
  let ctx: Ctx;

  test.beforeAll(async () => { ctx = await setup(); });
  test.afterAll(async () => {
    if (!ctx) return;
    await ctx.api.post(`${MAIN_API}/content/globalStyles`, { headers: ctx.headers, data: [ctx.styleBackup] });
    if (ctx.postId) await ctx.api.delete(`${MAIN_API}/content/posts/${ctx.postId}`, { headers: ctx.headers });
  });

  test("RefTagger links a directly loaded post", async ({ page }) => {
    await page.route("https://api.reftagger.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: REFTAGGER_STUB }));
    await page.goto(`/blog/${SLUG}`, { timeout: 60000 });
    await expect(page.locator("a.rtBibleRef", { hasText: "Matthew 28:19-20" })).toBeVisible({ timeout: 30000 });
  });

  test("RefTagger links the post opened from /blog", async ({ page }) => {
    await page.route("https://api.reftagger.com/**", (route) => route.fulfill({ contentType: "application/javascript", body: REFTAGGER_STUB }));

    await page.goto("/blog", { timeout: 60000 });
    const postLink = page.locator(`a[href="/blog/${SLUG}"]`).last();
    await expect(postLink).toBeVisible({ timeout: 30000 });
    // The library loaded on the list page.
    await expect.poll(() => page.evaluate(() => typeof (window as any).refTagger?.tag)).toBe("function");

    await postLink.click();
    await page.waitForURL(`**/blog/${SLUG}`);
    await expect(page.getByText("to baptize the nations")).toBeVisible();

    await expect(page.locator("a.rtBibleRef", { hasText: "Matthew 28:19-20" })).toBeVisible();
  });
});
