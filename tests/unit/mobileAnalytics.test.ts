import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appDisplayMode, churchAppMeasurementId, mobileAnalyticsIds, mobileAnalyticsInitScript } from "../../src/helpers/mobileAnalytics.ts";

describe("churchAppMeasurementId", () => {
  it("keeps a GA4 id", () => {
    assert.equal(churchAppMeasurementId(" G-ABC123 "), "G-ABC123");
  });

  it("drops script injection, GTM containers, and blanks", () => {
    assert.equal(churchAppMeasurementId("G-1');alert(1)//"), null);
    assert.equal(churchAppMeasurementId("GTM-ABC123"), null);
    assert.equal(churchAppMeasurementId(""), null);
    assert.equal(churchAppMeasurementId(undefined), null);
  });
});

describe("mobileAnalyticsIds", () => {
  it("sends to ChurchApps' tag and the church's tag", () => {
    assert.deepEqual(mobileAnalyticsIds("G-CHURCHAPPS", "G-CHURCH"), ["G-CHURCHAPPS", "G-CHURCH"]);
    assert.deepEqual(mobileAnalyticsIds("", "G-CHURCH"), ["G-CHURCH"]);
    assert.deepEqual(mobileAnalyticsIds("G-CHURCHAPPS", "GTM-X"), ["G-CHURCHAPPS"]);
    assert.deepEqual(mobileAnalyticsIds(undefined, undefined), []);
  });

  it("configures each id once with display_mode", () => {
    const script = mobileAnalyticsInitScript(["G-A", "G-B"]);
    assert.ok(script.includes("gtag('config','G-A',{display_mode:dm});"));
    assert.ok(script.includes("gtag('config','G-B',{display_mode:dm});"));
    assert.equal(script.split("gtag('js'").length, 2);
  });
});

describe("appDisplayMode", () => {
  it("is installed for iOS home-screen launches", () => {
    assert.equal(appDisplayMode({ navigator: { standalone: true } }), "installed");
  });

  it("is installed for standalone display mode", () => {
    assert.equal(appDisplayMode({ navigator: {}, matchMedia: () => ({ matches: true }) }), "installed");
  });

  it("is browser otherwise", () => {
    assert.equal(appDisplayMode({ navigator: {}, matchMedia: () => ({ matches: false }) }), "browser");
  });
});
