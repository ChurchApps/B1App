import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "https://862938d48d0a19a662dc97429cbce33f@o4510432524107776.ingest.us.sentry.io/4510435232514048",

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: 1,
  enableLogs: true,

  replaysSessionSampleRate: 0.1,

  replaysOnErrorSampleRate: 1.0,

  sendDefaultPii: true
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
