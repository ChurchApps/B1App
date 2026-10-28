import { ArrayHelper } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import type { GroupServiceTimeInterface } from "@churchapps/helpers";
import type { PersonInterface } from "@churchapps/helpers";
import type { ServiceTimeInterface } from "@churchapps/helpers";
import type { VisitInterface } from "@churchapps/helpers";
import type { VisitSessionInterface } from "@churchapps/helpers";

export class CheckinHelper {
  static pendingVisits: VisitInterface[] = [];
  static existingVisits: VisitInterface[] = [];

  static serviceId: string;
  static serviceTimes: ServiceTimeInterface[];
  static groupServiceTimes: GroupServiceTimeInterface[];
  static groups: GroupInterface[];
  static householdMembers: PersonInterface[];

  static selectedServiceTime: ServiceTimeInterface;

  public static isClosed(st: ServiceTimeInterface) {
    return st.checkinOpen === false;
  }

  // Soonest upcoming check-in opening among the times, e.g. "Sun 9:30 AM". Schedules are church-local wall time.
  public static opensLabel(times: ServiceTimeInterface[], now = new Date()): string {
    const week = 7 * 1440;
    const nowMinute = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes();
    let best: number | null = null;
    let bestWait = Infinity;
    times.forEach((st) => {
      const match = st.startTime?.match(/^(\d{1,2}):(\d{2})/);
      if (st.dayOfWeek == null || !match) return;
      const opens = st.dayOfWeek * 1440 + Number(match[1]) * 60 + Number(match[2]) - Math.max(0, st.checkinOpenMinutes ?? 0);
      const wait = (((opens - nowMinute) % week) + week) % week;
      if (wait < bestWait) { bestWait = wait; best = opens; }
    });
    if (best === null) return "";
    // 2024-01-07 was a Sunday; Date rolls the minute offset into the right weekday.
    return new Date(2024, 0, 7, 0, best).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
  }

  // GET /visits/checkin returns the person's latest visit for the service with its id removed, and that
  // visit may be from an earlier week, so "checked in" means the visit is dated today. The Api stamps
  // visitDate with midnight of its own day (UTC in production), so today's visit is the one that began
  // less than 24 hours ago; that holds whatever time zone the kiosk or the Api runs in.
  public static isVisitToday(visit: VisitInterface | null | undefined, now = new Date()): boolean {
    if (!visit?.visitDate) return false;
    const date = new Date(visit.visitDate);
    if (isNaN(date.getTime())) return false;
    const elapsed = now.getTime() - date.getTime();
    return elapsed >= 0 && elapsed < 24 * 60 * 60 * 1000;
  }

  public static getVisitByPersonId(visits: VisitInterface[], personId: string): VisitInterface | null {
    let result: VisitInterface | null = null;
    visits?.forEach((v) => {
      if (v.personId === personId) result = v;
    });
    return result;
  }

  public static setGroup(
    visitSessions: VisitSessionInterface[],
    serviceTimeId: string,
    groupId: string,
    displayName: string
  ) {
    for (let i = visitSessions.length - 1; i >= 0; i--) {
      if (visitSessions[i].session?.serviceTimeId === serviceTimeId) visitSessions.splice(i, 1);
    }
    if (groupId !== "") visitSessions.push({ session: { serviceTimeId: serviceTimeId, groupId: groupId, displayName: displayName } });
  }

  public static getDisplayGroup = (visitSession: VisitSessionInterface) => {
    const st: ServiceTimeInterface = ArrayHelper.getOne(
      CheckinHelper.serviceTimes,
      "id",
      visitSession.session?.serviceTimeId || ""
    );
    const group: GroupInterface = ArrayHelper.getOne((st?.groups || []).filter((g) => g != null), "id", visitSession.session?.groupId || "");
    return (st?.name || "") + " - " + (group?.name || "");
  };

  public static clearData = () => {
    CheckinHelper.pendingVisits = [];
    CheckinHelper.existingVisits = [];
    CheckinHelper.serviceId = undefined as unknown as string;
    CheckinHelper.serviceTimes = undefined as unknown as ServiceTimeInterface[];
    CheckinHelper.groupServiceTimes = undefined as unknown as GroupServiceTimeInterface[];
    CheckinHelper.groups = undefined as unknown as GroupInterface[];
    CheckinHelper.householdMembers = undefined as unknown as PersonInterface[];
    CheckinHelper.selectedServiceTime = undefined as unknown as ServiceTimeInterface;
  };
}
