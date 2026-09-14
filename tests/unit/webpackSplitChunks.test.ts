import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cacheGroups } from "../../webpackSplitChunks.mjs";

// Issue #1081: /mobile pages shipped the same CSS chunk twice - once correctly as
// <link rel="stylesheet">, and once as <script src="/_next/static/css/<hash>.css"
// async nonce="...">. The browser refuses the second one on MIME grounds and the
// two requests for the same URL race, which is what intermittently left the nav
// with only the default tabs.
//
// Next builds that <script> in server/app-render/required-scripts.js: it takes every
// entry of buildManifest.rootMainFiles and calls ReactDOM.preinit(src, { as: "script" })
// with no .js filter. rootMainFiles is the file list of the `main-app` entrypoint,
// and it includes .css by design. So the fix is to keep extracted stylesheets out of
// the shared chunks that `main-app` pulls in: no custom cache group may match a CSS module.

type FakeModule = { type: string; resource: string };

const cssModule = (resource: string): FakeModule => ({ type: "css/mini-extract", resource });
const jsModule = (resource: string): FakeModule => ({ type: "javascript/auto", resource });

// webpack accepts a RegExp (matched against module.resource... ) or a predicate for
// `test`; normalize both so the assertions read the same either way.
const matches = (test: unknown, module: FakeModule): boolean => {
  if (test === undefined) return true; // no test means "match every module"
  if (test instanceof RegExp) return test.test(module.resource);
  if (typeof test === "function") return !!(test as (m: FakeModule) => unknown)(module);
  throw new Error("unsupported cache group test");
};

const CSS_MODULES = [
  cssModule("/app/node_modules/@churchapps/apphelper/dist/styles/animations.css"),
  cssModule("/app/node_modules/@mui/material/styles/theme.css"),
  cssModule("/app/node_modules/react-cropper/node_modules/cropperjs/dist/cropper.css"),
  cssModule("/app/src/styles/vendor/pages.css")
];

const customGroups = () =>
  Object.entries(cacheGroups).filter(([, group]) => group && typeof group === "object");

describe("webpack splitChunks cache groups", () => {
  it("has the cache groups the build relies on", () => {
    assert.deepEqual(customGroups().map(([name]) => name), ["vendor", "mui", "churchapps", "common"]);
  });

  it("never pulls an extracted CSS module into a shared chunk", () => {
    for (const [name, group] of customGroups()) {
      for (const module of CSS_MODULES) {
        assert.equal(
          matches((group as { test?: unknown }).test, module),
          false,
          `cache group "${name}" must not match CSS module ${module.resource}`
        );
      }
    }
  });

  it("still groups the JavaScript it is meant to split out", () => {
    const groups = Object.fromEntries(customGroups()) as Record<string, { test?: unknown }>;
    assert.equal(matches(groups.vendor.test, jsModule("/app/node_modules/lodash/index.js")), true);
    assert.equal(matches(groups.mui.test, jsModule("/app/node_modules/@mui/material/Button.js")), true);
    assert.equal(matches(groups.churchapps.test, jsModule("/app/node_modules/@churchapps/apphelper/dist/index.js")), true);
    assert.equal(matches(groups.common.test, jsModule("/app/src/helpers/shared.ts")), true);
  });
});
