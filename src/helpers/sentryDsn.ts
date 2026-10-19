/**
 * Sentry options that depend on the DSN. The DSN comes from the environment only: a hard-coded fallback
 * meant every self-hosted copy of this repo reported its errors to our project (Sentry B1-APP-5W, -DN,
 * -64, -DP, -D5, -EQ: 7,661 events in a fortnight from hosts that are not ours). No DSN, no reporting.
 */
export function sentryDsnOptions(dsn: string | undefined): { dsn: string | undefined; enabled: boolean } {
  const value = dsn?.trim() || undefined;
  return { dsn: value, enabled: Boolean(value) };
}
