// Mirrors the Api rule for household edits: a Head or Spouse (not known to be under 18) may send staff
// changes for a Child in the same household (not known to be 18 or older). The Api enforces it; this only
// decides whether to offer the Edit action.
interface HouseholdPerson {
  id?: string;
  householdId?: string;
  householdRole?: string;
  birthDate?: Date | string;
}

const ADULT_AGE = 18;

const ageOf = (birthDate: Date | string | undefined, now: Date): number | null => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  let age = now.getUTCFullYear() - d.getUTCFullYear();
  if (now.getUTCMonth() < d.getUTCMonth() || (now.getUTCMonth() === d.getUTCMonth() && now.getUTCDate() < d.getUTCDate())) age--;
  return age;
};

const roleOf = (p: HouseholdPerson) => (p.householdRole || "").trim().toLowerCase();

export const canEditHouseholdMember = (self: HouseholdPerson | null | undefined, member: HouseholdPerson | null | undefined, now = new Date()): boolean => {
  if (!self?.id || !member?.id || self.id === member.id) return false;
  if (!self.householdId || self.householdId !== member.householdId) return false;
  const selfAge = ageOf(self.birthDate, now);
  const memberAge = ageOf(member.birthDate, now);
  const selfIsAdult = (roleOf(self) === "head" || roleOf(self) === "spouse") && !(selfAge !== null && selfAge < ADULT_AGE);
  const memberIsChild = roleOf(member) === "child" && !(memberAge !== null && memberAge >= ADULT_AGE);
  return selfIsAdult && memberIsChild;
};
