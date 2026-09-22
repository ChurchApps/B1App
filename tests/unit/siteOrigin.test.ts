import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { localeOrigin, publicOrigin } from "../../src/helpers/siteOrigin.ts";

const keys = ["NEXT_STAGE", "NEXT_PUBLIC_STAGE", "VERCEL_URL", "PORT"] as const;
const saved: Record<string, string | undefined> = {};

const setEnv = (values: Partial<Record<typeof keys[number], string | undefined>>) => {
  for (const key of keys) {
    if (!(key in saved)) saved[key] = process.env[key];
    const next = values[key];
    if (next === undefined) delete process.env[key];
    else process.env[key] = next;
  }
};

afterEach(() => {
  for (const key of keys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("site origins", () => {
  it("builds a tenant public origin from stage, not the request host", () => {
    setEnv({ NEXT_PUBLIC_STAGE: "prod", NEXT_STAGE: undefined, VERCEL_URL: undefined });
    assert.equal(publicOrigin("grace"), "https://grace.b1.church");
    setEnv({ NEXT_PUBLIC_STAGE: "staging" });
    assert.equal(publicOrigin("grace"), "https://grace.staging.b1.church");
  });

  it("uses VERCEL_URL for locale files so initServerSide can stay static", () => {
    setEnv({ VERCEL_URL: "b1-app.vercel.app", NEXT_PUBLIC_STAGE: "prod" });
    assert.equal(localeOrigin(), "https://b1-app.vercel.app");
  });
});
