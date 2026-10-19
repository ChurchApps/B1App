import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pageTreePath } from "../../src/helpers/pageTreePath.ts";

// Sentry B1-APP-EV (420 events) and B1-APP-EP (84): a request for /statement-of-faith%5C%5C%5C was sent on to
// the Api as tree?url=statement-of-faith\\\ (raw backslashes, 400), and an unknown subdomain reached the
// Api as /pages/undefined/tree. Both rendered a 500 page instead of a 404.
describe("pageTreePath", () => {
  it("encodes the page slug", () => {
    const slashes = "statement-of-faith\\\\\\";
    assert.equal(pageTreePath("CHU1", slashes), "/pages/CHU1/tree?url=statement-of-faith%5C%5C%5C");
    assert.equal(pageTreePath("CHU1", "about us"), "/pages/CHU1/tree?url=about%20us");
  });

  it("keeps a plain slug readable and appends the site", () => {
    assert.equal(pageTreePath("CHU1", "donate"), "/pages/CHU1/tree?url=donate");
    assert.equal(pageTreePath("CHU1", "donate", "SITE2"), "/pages/CHU1/tree?url=donate&siteId=SITE2");
    assert.equal(pageTreePath("CHU1", "donate", ""), "/pages/CHU1/tree?url=donate");
  });

  it("returns null when there is no church to ask for", () => {
    assert.equal(pageTreePath(undefined, "donate"), null);
    assert.equal(pageTreePath("", "donate"), null);
  });
});
