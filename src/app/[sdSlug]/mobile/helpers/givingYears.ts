// B1Admin > Settings > Giving "memberGivingYears": "" = all years, "off" = none, "2025" = through 2025.
// Applies to the member's history, totals and printable statements.
export const memberGivingYearLimit = (settings?: Record<string, unknown> | null) => {
  const raw = String(settings?.memberGivingYears ?? "");
  if (raw === "off") return 0;
  return parseInt(raw, 10) || Infinity;
};
