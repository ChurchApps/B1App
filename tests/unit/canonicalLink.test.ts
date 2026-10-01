import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalLink } from "../../src/helpers/canonicalLink.ts";

describe("canonicalLink", () => {
  it("points a church page at the host it was served on, without the query string", () => {
    assert.equal(canonicalLink("grace.b1.church", "https", "/about"), "<https://grace.b1.church/about>; rel=\"canonical\"");
    assert.equal(canonicalLink("www.gracechurch.org", "https", "/"), "<https://www.gracechurch.org/>; rel=\"canonical\"");
    assert.equal(canonicalLink("grace.localtest.me:8301", "http", "/sermons/SER1"), "<http://grace.localtest.me:8301/sermons/SER1>; rel=\"canonical\"");
  });

  it("takes the first forwarded host and lowercases it", () => {
    assert.equal(canonicalLink("Grace.B1.church, proxy.internal", "https", "/events"), "<https://grace.b1.church/events>; rel=\"canonical\"");
  });

  it("skips hosts that are not a church's public address", () => {
    for (const host of ["b1app-abc.vercel.app", "b1app.up.railway.app", "localhost:3301", "b1.church", ""]) {
      assert.equal(canonicalLink(host, "https", "/about"), null, host);
    }
  });

  it("skips private and non-page paths", () => {
    for (const path of ["/mobile", "/mobile/dashboard", "/login", "/logout", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest"]) {
      assert.equal(canonicalLink("grace.b1.church", "https", path), null, path);
    }
  });
});
