import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { churchCurrency } from "../../src/app/[sdSlug]/mobile/helpers/churchCurrency.ts";

// ChurchAppsSupport#1483: the app's giving screen uses the church currency setting when there is no provider.
describe("churchCurrency", () => {
  it("uses the first gateway's currency", () => {
    assert.equal(churchCurrency([{ currency: "EUR" }], { currency: "kes" }), "eur");
  });

  it("falls back to the public church currency setting when there is no gateway", () => {
    assert.equal(churchCurrency([], { currency: "KES" }), "kes");
    assert.equal(churchCurrency([{}], { currency: "php" }), "php");
  });

  it("falls back to usd with no gateway and no setting", () => {
    assert.equal(churchCurrency([], {}), "usd");
    assert.equal(churchCurrency(undefined, null), "usd");
  });
});
