import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { shareLink } from "../../src/helpers/shareLink.ts";

// ChurchAppsSupport#1696: Share on the public sermon page uses the member app's share fallback chain.
const setNavigator = (nav: unknown) => Object.defineProperty(globalThis, "navigator", { value: nav, configurable: true, writable: true });
const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const args = { title: "Grace", text: "Check out this sermon: \"Grace\"", url: "https://grace.b1.church/sermons/abc" };

describe("shareLink", () => {
  afterEach(() => { if (original) Object.defineProperty(globalThis, "navigator", original); });

  it("uses the share sheet when there is one", async () => {
    let shared: unknown = null;
    setNavigator({ share: async (data: unknown) => { shared = data; } });
    assert.equal(await shareLink(args), "shared");
    assert.deepEqual(shared, args);
  });

  it("reports a dismissed share sheet as cancelled", async () => {
    setNavigator({ share: async () => { const e = new Error("dismissed"); e.name = "AbortError"; throw e; }, clipboard: { writeText: async () => { throw new Error("should not copy"); } } });
    assert.equal(await shareLink(args), "cancelled");
  });

  it("copies the text when there is no share sheet", async () => {
    let copied = "";
    setNavigator({ clipboard: { writeText: async (t: string) => { copied = t; } } });
    assert.equal(await shareLink(args), "copied");
    assert.equal(copied, args.text);
  });

  it("fails when neither is available", async () => {
    setNavigator({});
    assert.equal(await shareLink(args), "failed");
  });
});
