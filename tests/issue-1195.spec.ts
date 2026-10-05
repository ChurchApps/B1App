import { test, expect } from "@playwright/test";
import { getApi, apiCall } from "./helpers/api";

const MAIN_API = process.env.API_BASE || "http://localhost:8084";

// Issue #1195: a redirect saved for /sermons was ignored and the built-in Sermons page rendered instead.
test("a redirect saved for /sermons wins over the built-in Sermons page", async ({ page }) => {
  const api = await getApi("demo");
  const target = "https://www.youtube.com/@issue1195";
  const saved = await apiCall(api, "post", `${MAIN_API}/content/redirects`, [{ fromPath: "/sermons", toPath: target }]);
  expect(saved.ok()).toBeTruthy();
  const [redirect] = await saved.json();

  try {
    const res = await page.request.get("/sermons", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()["location"]).toBe(target);
  } finally {
    await apiCall(api, "delete", `${MAIN_API}/content/redirects/${redirect.id}`);
  }
});
