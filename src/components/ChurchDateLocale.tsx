"use client";

import { DateHelper } from "@churchapps/helpers";

// Applies the church's region setting to DateHelper before any child renders a date.
export function ChurchDateLocale({ region, children }: { region?: string; children: React.ReactNode }) {
  DateHelper.setLocale(region);
  return <>{children}</>;
}
