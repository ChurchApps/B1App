import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import type { AnswerInterface, GroupInterface, QuestionInterface } from "@churchapps/helpers";

export interface MyFormSubmission {
  id?: string;
  formId?: string;
  submissionDate?: string | Date;
  form?: { id?: string; name?: string };
  questions?: QuestionInterface[];
  answers?: AnswerInterface[];
}

export interface MyAttendanceRecord {
  visitDate?: string | Date;
  groupId?: string;
  service?: { id?: string; name?: string };
  serviceTime?: { id?: string; name?: string };
}

// Read-only, self-scoped: the Api returns only what the signed-in member submitted or attended.
export const useMyFormSubmissions = (enabled: boolean) => useQuery<MyFormSubmission[]>({
  queryKey: ["/formsubmissions/my"],
  queryFn: async () => {
    const data = await ApiHelper.get("/formsubmissions/my?include=questions,answers", "MembershipApi");
    return Array.isArray(data) ? data : [];
  },
  enabled,
  staleTime: 60 * 1000
});

export const useMyAttendance = (enabled: boolean) => useQuery<MyAttendanceRecord[]>({
  queryKey: ["/attendancerecords/my"],
  queryFn: async () => {
    const data = await ApiHelper.get("/attendancerecords/my", "AttendanceApi");
    return Array.isArray(data) ? data : [];
  },
  enabled,
  staleTime: 5 * 60 * 1000
});

// Same key and fetcher as MePage / GroupsPage so the cache is shared.
export const useMyGroups = (enabled: boolean, userId?: string) => useQuery<GroupInterface[]>({
  queryKey: ["my-groups", userId],
  queryFn: async () => {
    const data = await ApiHelper.get("/groups/my", "MembershipApi");
    return Array.isArray(data) ? data : [];
  },
  enabled,
  staleTime: 5 * 60 * 1000,
  gcTime: 15 * 60 * 1000
});

// Group check-ins show the group's name; otherwise (or for a group the member has since left) the service.
export const attendanceTitle = (record: MyAttendanceRecord, groups: GroupInterface[]) => {
  const group = record.groupId ? groups.find((g) => g.id === record.groupId) : undefined;
  return group?.name || record.service?.name || record.serviceTime?.name || Locale.label("mobile.me.attended");
};

export const attendanceSubtitle = (record: MyAttendanceRecord, groups: GroupInterface[]) => {
  const date = record.visitDate ? DateHelper.prettyDate(new Date(record.visitDate)) : "";
  const title = attendanceTitle(record, groups);
  const detail = [record.service?.name, record.serviceTime?.name].find((n) => n && n !== title);
  return [date, detail].filter(Boolean).join(" · ");
};
