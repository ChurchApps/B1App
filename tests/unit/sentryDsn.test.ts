import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sentryDsnOptions } from "../../src/helpers/sentryDsn.ts";

describe("sentryDsnOptions", () => {
  it("enables Sentry only when a DSN is configured", () => {
    assert.deepEqual(sentryDsnOptions("https://key@o1.ingest.sentry.io/1"), { dsn: "https://key@o1.ingest.sentry.io/1", enabled: true });
  });

  it("disables Sentry when the DSN is missing or blank", () => {
    assert.deepEqual(sentryDsnOptions(undefined), { dsn: undefined, enabled: false });
    assert.deepEqual(sentryDsnOptions(""), { dsn: undefined, enabled: false });
    assert.deepEqual(sentryDsnOptions("   "), { dsn: undefined, enabled: false });
  });
});
