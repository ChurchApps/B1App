import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { AnswerInterface, GroupInterface, QuestionInterface, RegistrationInterface, TaskInterface } from "@churchapps/helpers";

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

// Same key on Me, Home and the group event cards, so they share one cache entry.
export const useMyRegistrations = (personId: string | undefined, enabled: boolean) => useQuery<RegistrationInterface[]>({
  queryKey: ["/registrations/person", personId],
  queryFn: async () => {
    const data = await ApiHelper.get("/registrations/person/" + personId, "ContentApi");
    return Array.isArray(data) ? data : [];
  },
  enabled: enabled && !!personId,
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

// Open workflow cards assigned to the signed-in member, soonest due first.
export const useMyCards = (enabled: boolean) => useQuery<TaskInterface[]>({
  queryKey: ["/tasks/cards/my", "DoingApi"],
  queryFn: async () => {
    const data = await ApiHelper.get("/tasks/cards/my", "DoingApi");
    return Array.isArray(data) ? data : [];
  },
  enabled,
  staleTime: 60 * 1000
});

// Open plain tasks assigned to the member; ones they only created are left to Me's Requests section.
export const useMyTasks = (personId: string | undefined, enabled: boolean) => useQuery<TaskInterface[]>({
  queryKey: ["/tasks", "DoingApi", personId],
  queryFn: async () => {
    const data = await ApiHelper.get("/tasks", "DoingApi");
    return (Array.isArray(data) ? data : []).filter((t: TaskInterface) => t.assignedToType === "person" && t.assignedToId === personId);
  },
  enabled: enabled && !!personId,
  staleTime: 60 * 1000
});

export const invalidateMyTasks = (queryClient: QueryClient) => Promise.all([
  queryClient.invalidateQueries({ queryKey: ["/tasks/cards/my", "DoingApi"] }),
  queryClient.invalidateQueries({ queryKey: ["/tasks", "DoingApi"] })
]);

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
