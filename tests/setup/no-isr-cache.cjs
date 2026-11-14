// Incremental cache handler that stores nothing. next.config.mjs installs it when PW_NO_ISR is set, which the
// Playwright webServer does for its production build: ISR pages (the public layout's revalidate = 300) and
// cached fetches then render fresh on every request, so a test that edits content and reloads sees the edit,
// the same as against `next dev`. Interface: https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath
module.exports = class NoIsrCache {
  async get() { return null; }
  async set() {}
  async revalidateTag() {}
  resetRequestCache() {}
};
