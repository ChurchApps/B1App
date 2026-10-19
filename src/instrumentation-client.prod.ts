import * as Sentry from "@sentry/nextjs";
import { sentryDsnOptions } from "./helpers/sentryDsn";

Sentry.init({
  ...sentryDsnOptions(process.env.NEXT_PUBLIC_SENTRY_DSN),

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: 1,
  enableLogs: true,

  replaysSessionSampleRate: 0.1,

  replaysOnErrorSampleRate: 1.0,

  sendDefaultPii: true
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
