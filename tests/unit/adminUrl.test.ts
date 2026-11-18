import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminLoginUrl } from "../../src/helpers/adminUrl.ts";

// ChurchAppsSupport#1620: self-hosted B1 serves the admin under /admin, and the link dropped it.
describe("adminLoginUrl", () => {
  it("keeps the path of a self-hosted admin root", () => {
    assert.equal(adminLoginUrl("https://domain.net/admin", "CHU1", "a.b.c"), "https://domain.net/admin/login?churchId=CHU1&returnUrl=%2F#jwt=a.b.c");
    assert.equal(adminLoginUrl("https://domain.net/admin/", "CHU1", "a.b.c", "/profile"), "https://domain.net/admin/login?churchId=CHU1&returnUrl=%2Fprofile#jwt=a.b.c");
  });

  it("is unchanged for the hosted admin root", () => {
    assert.equal(adminLoginUrl("https://admin.b1.church", "CHU1", "a.b.c", "/mobile/navigation"), "https://admin.b1.church/login?churchId=CHU1&returnUrl=%2Fmobile%2Fnavigation#jwt=a.b.c");
  });
});
