import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isNoindexHost, isNoindexStage } from "../../src/helpers/noindexHost.ts";

describe("isNoindexHost", () => {
  it("matches staging and demosite tenant hosts", () => {
    assert.equal(isNoindexHost("grace.staging.b1.church"), true);
    assert.equal(isNoindexHost("grace.demosite.b1.church"), true);
  });

  it("does not match production church hosts", () => {
    assert.equal(isNoindexHost("grace.b1.church"), false);
    assert.equal(isNoindexHost("www.gracechurch.org"), false);
  });
});

describe("isNoindexStage", () => {
  it("noindexes every non-prod stage without reading the request", () => {
    assert.equal(isNoindexStage("staging"), true);
    assert.equal(isNoindexStage("dev"), true);
    assert.equal(isNoindexStage("demo"), true);
    assert.equal(isNoindexStage("prod"), false);
    assert.equal(isNoindexStage(""), false);
    assert.equal(isNoindexStage(undefined), false);
  });
});
