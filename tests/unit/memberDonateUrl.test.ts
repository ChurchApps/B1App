import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { memberDonateUrl } from "../../src/app/[sdSlug]/mobile/helpers/memberDonateUrl.ts";

// Giving links (B1Admin Funds page) must keep their params when a signed-in member is redirected to the app.
describe("memberDonateUrl", () => {
  it("sends a plain /donate visit to the donate screen", () => {
    assert.equal(memberDonateUrl(""), "/mobile/donate");
    assert.equal(memberDonateUrl(null), "/mobile/donate");
  });

  it("keeps ?recurring=1 and opens the Give view", () => {
    assert.equal(memberDonateUrl("?recurring=1"), "/mobile/donate?recurring=1&view=give");
  });

  it("keeps the fund and amount with recurring", () => {
    assert.equal(memberDonateUrl("?fundId=FUN00000001&amount=50&recurring=1"), "/mobile/donate?fundId=FUN00000001&amount=50&recurring=1&view=give");
  });

  it("leaves an explicit view alone", () => {
    assert.equal(memberDonateUrl("?view=history"), "/mobile/donate?view=history");
  });
});
