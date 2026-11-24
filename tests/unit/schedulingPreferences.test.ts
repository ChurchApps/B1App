import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasPreferences, isPreferenceFormValid, normalizeHousehold, parseMaxPerMonth, toPreferenceForm, toPreferencePayload } from "../../src/helpers/schedulingPreferences.ts";

describe("scheduling preferences form", () => {
  it("starts empty when the member has no row", () => {
    assert.deepEqual(toPreferenceForm(null), { maxPerMonth: "", preferredTimes: "", householdScheduling: "none" });
    assert.equal(hasPreferences(null), false);
    assert.equal(hasPreferences({ householdScheduling: "none", preferredTimes: "", maxPerMonth: null }), false);
  });

  it("loads an existing row", () => {
    const form = toPreferenceForm({ id: "SP1", personId: "PER1", maxPerMonth: 2, preferredTimes: "9:00 am", householdScheduling: "apart" });
    assert.deepEqual(form, { maxPerMonth: "2", preferredTimes: "9:00 am", householdScheduling: "apart" });
    assert.equal(hasPreferences({ maxPerMonth: 2 }), true);
    assert.equal(hasPreferences({ householdScheduling: "together" }), true);
  });

  it("treats unknown household values as no preference", () => {
    assert.equal(normalizeHousehold(null), "none");
    assert.equal(normalizeHousehold("sometimes"), "none");
    assert.equal(normalizeHousehold("together"), "together");
  });

  it("accepts blank or a whole number of at least 1 for max per month", () => {
    assert.equal(parseMaxPerMonth(""), null);
    assert.equal(parseMaxPerMonth("  "), null);
    assert.equal(parseMaxPerMonth("3"), 3);
    assert.equal(parseMaxPerMonth(" 12 "), 12);
    assert.equal(parseMaxPerMonth("0"), undefined);
    assert.equal(parseMaxPerMonth("-1"), undefined);
    assert.equal(parseMaxPerMonth("1.5"), undefined);
    assert.equal(parseMaxPerMonth("two"), undefined);
    assert.equal(isPreferenceFormValid({ maxPerMonth: "0", preferredTimes: "", householdScheduling: "none" }), false);
  });

  it("saves the member's own row: no id or personId, blank limit sent as null", () => {
    const payload = toPreferencePayload({ maxPerMonth: "", preferredTimes: " 9:00 am ,, First Service ", householdScheduling: "together" });
    assert.deepEqual(payload, { maxPerMonth: null, preferredTimes: "9:00 am, First Service", householdScheduling: "together" });
    assert.equal("id" in payload, false);
    assert.equal("personId" in payload, false);
  });
});
