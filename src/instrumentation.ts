import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// debug-1001: ship request errors to the in-memory collector route (separate lambda, so POST instead of globalThis)
export const onRequestError: typeof Sentry.captureRequestError = async (err: any, request: any, context: any) => {
  try {
    const host = request?.headers?.host || request?.headers?.["x-forwarded-host"] || "";
    const payload = { kind: "error", path: request?.path, host, routerKind: context?.routerKind, routePath: context?.routePath, routeType: context?.routeType, renderSource: context?.renderSource, message: err?.message, digest: err?.digest, name: err?.name, stack: err?.stack, cause: err?.cause ? String(err.cause) : undefined };
    console.error("debug-1001", JSON.stringify(payload));
    if (host) await fetch("https://" + host + "/api/debug-1001", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
  } catch { /* ignore */ }
  return Sentry.captureRequestError(err, request, context);
};
