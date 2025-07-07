import { ArrayHelper } from "@churchapps/apphelper/dist/helpers/ArrayHelper";
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
    if (groupId !== "")
      visitSessions.push({ session: { serviceTimeId: serviceTimeId, groupId: groupId, displayName: displayName } });
  }

  public static getDisplayGroup = (visitSession: VisitSessionInterface) => {
    const st: ServiceTimeInterface = ArrayHelper.getOne(
      CheckinHelper.serviceTimes,
      "id",
      visitSession.session?.serviceTimeId || ""
    );
    const group: GroupInterface = ArrayHelper.getOne(st?.groups || [], "id", visitSession.session?.groupId || "");
    return st.name + " - " + group.name;
  };
}
