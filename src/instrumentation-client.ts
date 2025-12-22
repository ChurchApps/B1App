// Dev client instrumentation - no Sentry to avoid Turbopack symlink issues on Windows
// For production builds, this file is replaced with instrumentation-client.prod.ts via prebuild script
export function onRouterTransitionStart() {
  // No-op in development
}