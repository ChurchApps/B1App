// Dev instrumentation - no Sentry to avoid Turbopack symlink issues on Windows
// For production builds, this file is replaced with instrumentation.prod.ts via prebuild script
export async function register() {
  // No-op in development
}

export function onRequestError() {
  // No-op in development
}
