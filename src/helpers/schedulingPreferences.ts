// The member's own scheduling preference row (doing.schedulingPreferences). The Api upserts on
// personId and, for members without plan-edit access, only ever saves the caller's own row.

export type HouseholdScheduling = "none" | "together" | "apart";

export interface SchedulingPreference {
  id?: string;
  personId?: string;
  maxPerMonth?: number | null;
  preferredTimes?: string | null;
  householdScheduling?: string | null;
}

export interface SchedulingPreferenceForm {
  maxPerMonth: string;
  preferredTimes: string;
  householdScheduling: HouseholdScheduling;
}

export const normalizeHousehold = (value?: string | null): HouseholdScheduling =>
  value === "together" || value === "apart" ? value : "none";

export const toPreferenceForm = (pref?: SchedulingPreference | null): SchedulingPreferenceForm => ({
  maxPerMonth: pref?.maxPerMonth && pref.maxPerMonth > 0 ? String(pref.maxPerMonth) : "",
  preferredTimes: pref?.preferredTimes || "",
  householdScheduling: normalizeHousehold(pref?.householdScheduling)
});

// Blank means no limit; anything else must be a whole number of at least 1.
export const parseMaxPerMonth = (value: string): number | null | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const n = parseInt(trimmed, 10);
  return n >= 1 ? n : undefined;
};

export const isPreferenceFormValid = (form: SchedulingPreferenceForm) => parseMaxPerMonth(form.maxPerMonth) !== undefined;

// Comma-separated tokens, matched by the auto-scheduler against service time names.
export const normalizePreferredTimes = (value: string) =>
  value.split(",").map((t) => t.trim()).filter(Boolean).join(", ");

// null clears maxPerMonth on the row; no id or personId so the Api saves the caller's own row.
export const toPreferencePayload = (form: SchedulingPreferenceForm) => ({
  maxPerMonth: parseMaxPerMonth(form.maxPerMonth) ?? null,
  preferredTimes: normalizePreferredTimes(form.preferredTimes),
  householdScheduling: form.householdScheduling
});

export const hasPreferences = (pref?: SchedulingPreference | null) => {
  const form = toPreferenceForm(pref);
  return !!form.maxPerMonth || !!form.preferredTimes.trim() || form.householdScheduling !== "none";
};
