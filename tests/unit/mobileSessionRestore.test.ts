import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

// Production runs effects once, children before parents. Session restore posts
// /users/login from a child effect. If that runs before EnvironmentHelper.init(),
// the post throws and a refresh looks like a logout (issue #1295). Dev hides it
// because Strict Mode runs the effect again after the parent effect has configured the API.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("mobile session restore", () => {
  it("configures the API client before trading the saved jwt for a session", () => {
    const hook = read("../../src/app/[sdSlug]/mobile/hooks/useHydrateSession.ts");
    const hydrate = hook.slice(hook.indexOf("const hydrate = async"));
    const initAt = hydrate.indexOf("EnvironmentHelper.init()");
    const postAt = hydrate.indexOf("ApiHelper.postAnonymous");
    assert.ok(initAt >= 0, "hydrate() must call EnvironmentHelper.init()");
    assert.ok(postAt > initAt, "init() must run before the login post");
  });

  it("configures the API client when the mobile layout loads, not only in a later effect", () => {
    const layout = read("../../src/app/[sdSlug]/mobile/MobileClientLayout.tsx");
    const initAt = layout.indexOf('if (typeof window !== "undefined") EnvironmentHelper.init();');
    const componentAt = layout.indexOf("export function MobileClientLayout");
    assert.ok(initAt >= 0 && componentAt > initAt);
  });
});
