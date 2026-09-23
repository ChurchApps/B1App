import { test, expect } from "@playwright/test";

test("a viewer who arrives before the service sees the video start without reloading", async ({ page }) => {
  const serviceTime = new Date(Date.now() + 15000).toISOString();
  await page.route(/youtube\.com|vimeo\.com/, (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<html></html>" }));
  await page.route("**/preview/data/**", async (route) => {
    const res = await route.fetch();
    const data = await res.json();
    const first = data.services[0];
    data.services = [{ ...first, serviceTime, earlyStart: "0:00", chatBefore: "60:00", chatAfter: "60:00" }];
    await route.fulfill({ response: res, json: data });
  });

  await page.goto("/stream");
  const container = page.locator("#videoContainer");
  await expect(container.locator("#noVideoContent p")).toHaveText(/^00:00:\d\d$/, { timeout: 30000 });
  await expect(container.locator("#videoFrame")).toHaveCount(0);
  await expect(container.locator("#videoFrame")).toHaveCount(1, { timeout: 30000 });
});
