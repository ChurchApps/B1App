import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeFirstDayOfWeek, getFirstDayOfWeek, weekdayColumn, rotateWeekdays } from "../../src/helpers/firstDayOfWeek.ts";

describe("normalizeFirstDayOfWeek", () => {
  it("passes through valid day indexes", () => {
    for (let d = 0; d <= 6; d++) assert.equal(normalizeFirstDayOfWeek(d), d);
  });

  it("accepts numeric strings from loosely-typed settings", () => {
    assert.equal(normalizeFirstDayOfWeek("1"), 1);
    assert.equal(normalizeFirstDayOfWeek("6"), 6);
  });

  it("defaults invalid values to Sunday", () => {
    assert.equal(normalizeFirstDayOfWeek(undefined), 0);
    assert.equal(normalizeFirstDayOfWeek(null), 0);
    assert.equal(normalizeFirstDayOfWeek(-1), 0);
    assert.equal(normalizeFirstDayOfWeek(7), 0);
    assert.equal(normalizeFirstDayOfWeek(2.5), 0);
    assert.equal(normalizeFirstDayOfWeek("monday"), 0);
    assert.equal(normalizeFirstDayOfWeek(NaN), 0);
  });
});

describe("getFirstDayOfWeek", () => {
  it("reads the church setting", () => {
    assert.equal(getFirstDayOfWeek({ firstDayOfWeek: 1 }), 1);
  });

  it("defaults to Sunday when the church or setting is missing", () => {
    assert.equal(getFirstDayOfWeek(undefined), 0);
    assert.equal(getFirstDayOfWeek(null), 0);
    assert.equal(getFirstDayOfWeek({}), 0);
  });
});

describe("weekdayColumn", () => {
  it("is the identity for Sunday-first weeks", () => {
    for (let d = 0; d <= 6; d++) assert.equal(weekdayColumn(d, 0), d);
  });

  it("shifts columns for Monday-first weeks", () => {
    assert.equal(weekdayColumn(1, 1), 0); // Monday leads
    assert.equal(weekdayColumn(0, 1), 6); // Sunday wraps to the end
    assert.equal(weekdayColumn(6, 1), 5);
  });

  it("shifts columns for Saturday-first weeks", () => {
    assert.equal(weekdayColumn(6, 6), 0);
    assert.equal(weekdayColumn(0, 6), 1);
    assert.equal(weekdayColumn(5, 6), 6);
  });

  it("always yields a valid column for every day/start combination", () => {
    for (let start = 0; start <= 6; start++) {
      const columns = new Set<number>();
      for (let d = 0; d <= 6; d++) columns.add(weekdayColumn(d, start));
      assert.equal(columns.size, 7);
      assert.equal(weekdayColumn(start, start), 0);
    }
  });
});

describe("rotateWeekdays", () => {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  it("keeps Sunday-first order by default", () => {
    assert.deepEqual(rotateWeekdays(labels, 0), labels);
  });

  it("rotates to Monday-first", () => {
    assert.deepEqual(rotateWeekdays(labels, 1), ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  });

  it("rotates to Saturday-first", () => {
    assert.deepEqual(rotateWeekdays(labels, 6), ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]);
  });

  it("does not mutate the input", () => {
    const copy = [...labels];
    rotateWeekdays(labels, 3);
    assert.deepEqual(labels, copy);
  });

  it("agrees with weekdayColumn: label at each column matches the day", () => {
    for (let start = 0; start <= 6; start++) {
      const rotated = rotateWeekdays(labels, start);
      for (let d = 0; d <= 6; d++) assert.equal(rotated[weekdayColumn(d, start)], labels[d]);
    }
  });
});
