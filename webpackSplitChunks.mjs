// Client-side splitChunks cache groups for the webpack build (next.config.mjs).
//
// Extracted so the grouping rules can be unit tested. The rule these encode is
// narrow but load-bearing: no cache group may match a CSS module. A cache group
// that also swallows stylesheets hoists them into a chunk owned by the shared
// `main-app` entrypoint, which puts the .css into buildManifest.rootMainFiles -
// and Next feeds every file in that list to ReactDOM.preinit(src, { as: "script" })
// with no .js filter (server/app-render/required-scripts.js). The page then ships
// <script src="/_next/static/css/<hash>.css"> next to the real
// <link rel="stylesheet"> for the same URL. See tests/unit/webpackSplitChunks.test.ts.

// Extracted stylesheets arrive as mini-css-extract modules; the resource check
// also catches a raw .css asset that reached the group some other way.
const isCssModule = (module) => {
  const type = module?.type ?? "";
  return type.startsWith("css") || /\.(css|scss|sass)(\?|$)/i.test(module?.resource ?? "");
};

const javaScriptIn = (pattern) => (module) =>
  !isCssModule(module) && pattern.test(module?.resource ?? "");

export const cacheGroups = {
  default: false,
  vendors: false,
  // Vendor code splitting
  vendor: {
    name: "vendor",
    chunks: "all",
    test: javaScriptIn(/node_modules/),
    priority: 20
  },
  // MUI components
  mui: {
    name: "mui",
    test: javaScriptIn(/[\\/]node_modules[\\/]@mui[\\/]/),
    chunks: "all",
    priority: 30
  },
  // ChurchApps packages
  churchapps: {
    name: "churchapps",
    test: javaScriptIn(/[\\/]node_modules[\\/]@churchapps[\\/]/),
    chunks: "all",
    priority: 25
  },
  // Common components
  common: {
    name: "common",
    test: (module) => !isCssModule(module),
    minChunks: 2,
    priority: 10,
    reuseExistingChunk: true,
    enforce: true
  }
};

export const splitChunks = { chunks: "all", cacheGroups };
