// Same-day conflicts for a signup plan: other plans the member already serves that day, and
// blockout ranges covering it. Days are compared on the local calendar; callers pass Dates
// already parsed with DateHelper.toDate so date-only values land on the right day.

export interface ServingDay {
  planId?: string;
  serviceDate: Date;
  positionName?: string;
  status?: string;
}

export interface BlockoutRange {
  startDate: Date;
  endDate?: Date;
}

export interface ServingConflicts {
  serving: boolean;
  positionNames: string[];
  blockedOut: boolean;
}

export const dayNumber = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

const isValid = (d?: Date): d is Date => d instanceof Date && !Number.isNaN(d.getTime());

export const findServingConflicts = (planId: string, serviceDate: Date, assignments: ServingDay[], blockouts: BlockoutRange[]): ServingConflicts => {
  if (!isValid(serviceDate)) return { serving: false, positionNames: [], blockedOut: false };
  const day = dayNumber(serviceDate);

  // Signing up for this plan is not a conflict with itself; declined requests aren't commitments.
  const sameDay = assignments.filter((a) => isValid(a.serviceDate)
    && a.planId !== planId
    && (a.status || "").toLowerCase() !== "declined"
    && dayNumber(a.serviceDate) === day);
  const positionNames = [...new Set(sameDay.map((a) => (a.positionName || "").trim()).filter(Boolean))];

  const blockedOut = blockouts.some((b) => {
    if (!isValid(b.startDate)) return false;
    const start = dayNumber(b.startDate);
    const end = isValid(b.endDate) ? dayNumber(b.endDate) : start;
    return day >= Math.min(start, end) && day <= Math.max(start, end);
  });

  return { serving: sameDay.length > 0, positionNames, blockedOut };
};
