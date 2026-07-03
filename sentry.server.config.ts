// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? "https://862938d48d0a19a662dc97429cbce33f@o4510432524107776.ingest.us.sentry.io/4510435232514048",
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: false
});
