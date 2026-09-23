import { test, expect, type Page } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

const readPersistedQueryKeys = (page: Page) => page.evaluate(() => new Promise<string[]>((resolve) => {
  const req = indexedDB.open("keyval-store");
  req.onerror = () => resolve([]);
  req.onsuccess = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains("keyval")) { db.close(); resolve([]); return; }
    const get = db.transaction("keyval", "readonly").objectStore("keyval").get("b1-mobile-query-cache");
    get.onsuccess = () => {
      db.close();
      resolve((get.result?.clientState?.queries || []).map((q: { queryKey: unknown }) => JSON.stringify(q.queryKey)));
    };
    get.onerror = () => { db.close(); resolve([]); };
  };
}));

test("mobile logout clears the persisted query cache", async ({ page }) => {
  await page.goto("/mobile/login");
  await page.locator('input[type="email"]').first().fill("demo@b1.church");
  await page.locator('input[type="password"]').first().fill("password");
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/\/mobile\/dashboard/, { timeout: 30000 });

  await page.goto("/mobile/groups");
  await expect.poll(async () => (await readPersistedQueryKeys(page)).some((k) => k.includes("my-groups")), { timeout: 20000 }).toBe(true);

  await page.goto("/mobile/logout");
  await page.waitForURL((url) => !url.pathname.includes("/logout"), { timeout: 15000 });
  await expect.poll(async () => (await readPersistedQueryKeys(page)).some((k) => k.includes("my-groups")), { timeout: 10000 }).toBe(false);
});
