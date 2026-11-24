import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dayNumber, findServingConflicts } from "../../src/helpers/servingConflicts.ts";

const day = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h);
const sunday = day(2030, 6, 2, 9);

describe("findServingConflicts", () => {
  it("flags another plan the member serves the same day, with its position", () => {
    const r = findServingConflicts("PLAN_A", sunday, [{ planId: "PLAN_B", serviceDate: day(2030, 6, 2, 18), positionName: "Usher", status: "Accepted" }], []);
    assert.deepEqual(r, { serving: true, positionNames: ["Usher"], blockedOut: false });
  });

  it("ignores the plan being signed up for, declined requests and other days", () => {
    const r = findServingConflicts("PLAN_A", sunday, [
      { planId: "PLAN_A", serviceDate: sunday, positionName: "Greeter" },
      { planId: "PLAN_B", serviceDate: sunday, positionName: "Usher", status: "Declined" },
      { planId: "PLAN_C", serviceDate: day(2030, 6, 3), positionName: "Sound" },
      { planId: "PLAN_D", serviceDate: new Date("not a date"), positionName: "Lights" }
    ], []);
    assert.deepEqual(r, { serving: false, positionNames: [], blockedOut: false });
  });

  it("counts pending requests and lists each position once", () => {
    const r = findServingConflicts("PLAN_A", sunday, [
      { planId: "PLAN_B", serviceDate: sunday, positionName: "Usher", status: "Unconfirmed" },
      { planId: "PLAN_C", serviceDate: sunday, positionName: "Usher" },
      { planId: "PLAN_D", serviceDate: sunday, positionName: " " }
    ], []);
    assert.equal(r.serving, true);
    assert.deepEqual(r.positionNames, ["Usher"]);
  });

  it("still flags serving when the position has no name", () => {
    const r = findServingConflicts("PLAN_A", sunday, [{ planId: "PLAN_B", serviceDate: sunday }], []);
    assert.deepEqual(r, { serving: true, positionNames: [], blockedOut: false });
  });

  it("flags a blockout range that covers the day, inclusive of both ends", () => {
    assert.equal(findServingConflicts("P", sunday, [], [{ startDate: day(2030, 6, 1), endDate: day(2030, 6, 2) }]).blockedOut, true);
    assert.equal(findServingConflicts("P", sunday, [], [{ startDate: day(2030, 6, 2), endDate: day(2030, 6, 9) }]).blockedOut, true);
    assert.equal(findServingConflicts("P", sunday, [], [{ startDate: day(2030, 6, 2, 12) }]).blockedOut, true);
  });

  it("does not flag blockouts on other days", () => {
    const r = findServingConflicts("P", sunday, [], [
      { startDate: day(2030, 5, 20), endDate: day(2030, 6, 1) },
      { startDate: day(2030, 6, 3), endDate: day(2030, 6, 10) },
      { startDate: new Date("bad") }
    ]);
    assert.equal(r.blockedOut, false);
  });

  it("tolerates a reversed range", () => {
    assert.equal(findServingConflicts("P", sunday, [], [{ startDate: day(2030, 6, 5), endDate: day(2030, 6, 1) }]).blockedOut, true);
  });

  it("returns nothing for an invalid service date", () => {
    const r = findServingConflicts("P", new Date("bad"), [{ planId: "Q", serviceDate: sunday }], [{ startDate: sunday }]);
    assert.deepEqual(r, { serving: false, positionNames: [], blockedOut: false });
  });

  it("compares local calendar days, ignoring the time", () => {
    assert.equal(dayNumber(day(2030, 6, 2, 0)), dayNumber(day(2030, 6, 2, 23)));
    assert.notEqual(dayNumber(day(2030, 6, 2)), dayNumber(day(2030, 6, 3)));
  });
});
