import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// debug-1001: keep the last few request errors in memory so /api/debug-1001 can show them
export const onRequestError: typeof Sentry.captureRequestError = async (err: any, request: any, context: any) => {
  const g = globalThis as any;
  g.__debug1001 = g.__debug1001 || [];
  g.__debug1001.unshift({ at: new Date().toISOString(), path: request?.path, routerKind: context?.routerKind, routePath: context?.routePath, routeType: context?.routeType, renderSource: context?.renderSource, message: err?.message, digest: err?.digest, name: err?.name, stack: err?.stack });
  g.__debug1001 = g.__debug1001.slice(0, 10);
  return Sentry.captureRequestError(err, request, context);
};
