// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from "@sentry/nextjs";
import { sentryDsnOptions } from "./src/helpers/sentryDsn";

Sentry.init({
  ...sentryDsnOptions(process.env.SENTRY_DSN),
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: false
});
