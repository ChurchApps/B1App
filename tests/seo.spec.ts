import { test, expect } from "@playwright/test";

// Church sites send their canonical as a Link header from middleware, on whatever host the church is served from.
test.describe("SEO", () => {
  for (const path of ["/", "/about", "/sermons/SER00000007"]) {
    test(`${path} names itself as canonical`, async ({ request, baseURL }) => {
      const response = await request.get(path + "?utm_source=test");
      expect(response.status()).toBe(200);
      expect(response.headers()["link"]).toContain(`<${new URL(path, baseURL).href}>; rel="canonical"`);
    });
  }

  test("the member portal gets no canonical", async ({ request }) => {
    const response = await request.get("/login");
    expect(response.headers()["link"] || "").not.toContain("canonical");
  });
});
