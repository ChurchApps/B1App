"use client";

import React, { useContext, useState } from "react";
import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiHelper, DateHelper, Locale, Notes, Permissions, UserHelper } from "@churchapps/apphelper";
import type { ConversationInterface, PersonInterface, TaskInterface, UserContextInterface, WorkflowBoardInterface } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";
import { invalidateMyTasks } from "../../helpers/myRecords";
import { KeyValues, Row, Sheet, StatusBadge } from "../kit";

const tc = mobileTheme.colors;
const SNOOZE_DAYS = [1, 3, 7];

const isSnoozed = (t: TaskInterface) => !!t.snoozedUntil && new Date(t.snoozedUntil).getTime() > Date.now();
const isOverdue = (t: TaskInterface) => !!t.dueDate && new Date(t.dueDate).getTime() < Date.now();
const snoozeLabel = (days: number) => days === 1 ? Locale.label("mobile.card.snoozeDay") : Locale.label("mobile.card.snoozeDays").replace("{}", String(days));

// One row for a card or a plain task, shared by Me, Home and the full list.
export const TaskRow = ({ task, onOpen }: { task: TaskInterface; onOpen: (t: TaskInterface) => void }) => {
  const card = !!task.workflowId;
  const subtitle = card
    ? (task.dueDate ? Locale.label("mobile.card.dueOn").replace("{}", DateHelper.prettyDate(new Date(task.dueDate))) : undefined)
    : task.associatedWithLabel || undefined;
  let badge: React.ReactNode;
  if (card && isSnoozed(task)) badge = <StatusBadge tone="neu">{Locale.label("mobile.card.snoozed")}</StatusBadge>;
  else if (card && isOverdue(task)) badge = <StatusBadge tone="bad">{Locale.label("mobile.card.overdue")}</StatusBadge>;
  return (
    <Row
      onClick={() => onOpen(task)}
      data-testid={card ? "task-row-card" : "task-row-task"}
      title={task.title || task.associatedWithLabel || ""}
      subtitle={subtitle}
      trailing={badge}
      chevron
    />
  );
};

// The person a card is about links to their directory profile only when the directory shows them to this member.
const AboutPerson = ({ task }: { task: TaskInterface }) => {
  const id = task.associatedWithType?.toLowerCase() === "person" ? task.associatedWithId : undefined;
  const { data: person } = useQuery<PersonInterface | null>({
    queryKey: ["community-person", id],
    queryFn: async () => {
      const data = await ApiHelper.get(`/people/${id}`, "MembershipApi");
      return data || null;
    },
    enabled: !!id,
    retry: false
  });
  const label = task.associatedWithLabel || person?.name?.display || "";
  if (id && person?.id) return <Box component={Link} href={`/mobile/community/${id}`} sx={{ color: tc.primary, fontWeight: 500 }}>{label}</Box>;
  return <>{label}</>;
};

// Call and Email rows for the person a task is about. The Api only returns them to people who can view the task.
const useContactItems = (task: TaskInterface) => {
  const isPerson = task.associatedWithType?.toLowerCase() === "person" && !!task.associatedWithId;
  const { data: contact } = useQuery<{ mobilePhone?: string; email?: string }>({
    queryKey: ["/tasks/" + task.id + "/contact", "DoingApi"],
    queryFn: async () => (await ApiHelper.get("/tasks/" + task.id + "/contact", "DoingApi")) || {},
    enabled: isPerson && !!task.id,
    retry: false
  });
  return [
    { label: Locale.label("mobile.details.call"), value: isPerson && contact?.mobilePhone ? <Box component="a" href={"tel:" + contact.mobilePhone} data-testid="task-contact-phone" sx={{ color: tc.primary, fontWeight: 500 }}>{contact.mobilePhone}</Box> : undefined },
    { label: Locale.label("mobile.details.email"), value: isPerson && contact?.email ? <Box component="a" href={"mailto:" + contact.email} data-testid="task-contact-email" sx={{ color: tc.primary, fontWeight: 500 }}>{contact.email}</Box> : undefined }
  ];
};

const NotesBlock = ({ task, onCreated }: { task: TaskInterface; onCreated?: (conversationId: string) => void }) => {
  const context = useContext(UserContext);
  // Only a card's assignee may attach its notes thread; a plain task shows the notes it already has.
  const createConversation = task.workflowId ? async () => {
    const conv: ConversationInterface = { allowAnonymousPosts: false, contentType: "workflowCard", contentId: task.id, title: "Card " + task.id + " Notes", visibility: "hidden" };
    const result: ConversationInterface[] = await ApiHelper.post("/conversations", [conv], "MessagingApi");
    const saved: TaskInterface = await ApiHelper.post("/tasks/" + task.id + "/conversation", { conversationId: result[0].id }, "DoingApi");
    const conversationId = saved?.conversationId || result[0].id || "";
    onCreated?.(conversationId);
    return conversationId;
  } : undefined;
  if (!task.workflowId && !task.conversationId) return null;
  return (
    <Box sx={{ mt: "16px" }} data-testid="task-notes">
      <Typography component="h3" sx={{ fontSize: 13, fontWeight: 650, letterSpacing: "0.06em", textTransform: "uppercase", color: tc.textSecondary, mb: "6px" }}>{Locale.label("mobile.card.notes")}</Typography>
      <Notes context={context as UserContextInterface} conversationId={task.conversationId || ""} createConversation={createConversation} noDisplayBox maxHeight={320} />
    </Box>
  );
};

const CardSheet = ({ task, onClose }: { task: TaskInterface; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [card, setCard] = useState<TaskInterface>(task);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Step names and outcomes come from the board, which needs Tasks View; assignees without it get a step-less sheet, as in B1 Admin.
  const canViewBoard = UserHelper.checkAccess(Permissions.doingApi.tasks.view);
  const board = useQuery<WorkflowBoardInterface>({
    queryKey: ["/tasks/board/" + card.workflowId, "DoingApi"],
    queryFn: () => ApiHelper.get("/tasks/board/" + card.workflowId, "DoingApi"),
    enabled: canViewBoard && !!card.workflowId,
    staleTime: 60 * 1000
  });
  const step = board.data?.steps?.find((s) => s.id === card.stepId);
  const outcomes = (board.data?.routes || []).filter((r) => r.stepId === card.stepId && r.trigger === "onComplete");
  const routesReady = !canViewBoard || board.isFetched;
  const contactItems = useContactItems(card);

  const run = async (path: string, body: Record<string, unknown>, close: boolean) => {
    setBusy(true);
    setError("");
    try {
      const saved: TaskInterface = await ApiHelper.post(`/tasks/${card.id}/${path}`, body, "DoingApi");
      if (saved?.id === card.id) setCard({ ...card, ...saved });
      await invalidateMyTasks(queryClient);
      if (close) onClose();
    } catch (err: any) {
      setError(err?.message || Locale.label("mobile.card.actionFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={card.title || card.associatedWithLabel}>
      <KeyValues items={[
        { label: Locale.label("mobile.card.step"), value: step?.name },
        { label: Locale.label("mobile.card.due"), value: card.dueDate ? DateHelper.prettyDate(new Date(card.dueDate)) : undefined },
        { label: Locale.label("mobile.card.snoozedUntilLabel"), value: isSnoozed(card) ? <span data-testid="card-snoozed-until">{DateHelper.prettyDate(new Date(card.snoozedUntil as Date))}</span> : undefined },
        { label: Locale.label("mobile.card.about"), value: card.associatedWithLabel || card.associatedWithId ? <AboutPerson task={card} /> : undefined },
        ...contactItems,
        { label: Locale.label("mobile.card.created"), value: card.dateCreated ? DateHelper.prettyDateTime(new Date(card.dateCreated)) : undefined }
      ]} />

      <Box sx={{ mt: "16px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        {outcomes.length === 0 && routesReady && (
          <Button variant="contained" disabled={busy} onClick={() => run("complete", {}, true)}>{Locale.label("mobile.card.complete")}</Button>
        )}
        {outcomes.map((o) => (
          <Button key={o.id} variant="contained" disabled={busy} onClick={() => run("complete", { routeId: o.id }, true)}>{o.label}</Button>
        ))}
      </Box>
      <Box sx={{ mt: "12px", display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
        <Typography component="span" sx={{ fontSize: 14, color: tc.textSecondary, mr: "4px" }}>{Locale.label("mobile.card.snooze")}</Typography>
        {SNOOZE_DAYS.map((d) => (
          <Button key={d} size="small" variant="outlined" disabled={busy} onClick={() => run("snooze", { days: d }, false)}>{snoozeLabel(d)}</Button>
        ))}
      </Box>
      {error && <Typography sx={{ color: tc.error, fontSize: 14, mt: "8px" }}>{error}</Typography>}

      <NotesBlock task={card} onCreated={(conversationId) => { setCard((c) => ({ ...c, conversationId })); invalidateMyTasks(queryClient); }} />
    </Sheet>
  );
};

// Plain tasks are read-only here; closing one still happens in B1 Admin.
const TaskSheet = ({ task, onClose }: { task: TaskInterface; onClose: () => void }) => {
  const contactItems = useContactItems(task);
  return (
    <Sheet open onClose={onClose} title={task.title}>
      <KeyValues items={[
        { label: Locale.label("mobile.card.from"), value: task.createdByLabel },
        { label: Locale.label("mobile.card.about"), value: task.associatedWithLabel || task.associatedWithId ? <AboutPerson task={task} /> : undefined },
        ...contactItems,
        { label: Locale.label("mobile.card.created"), value: task.dateCreated ? DateHelper.prettyDateTime(new Date(task.dateCreated)) : undefined }
      ]} />
      <NotesBlock task={task} />
    </Sheet>
  );
};

export const MyTaskSheet = ({ task, onClose }: { task: TaskInterface | null; onClose: () => void }) => {
  if (!task) return null;
  return task.workflowId ? <CardSheet key={task.id} task={task} onClose={onClose} /> : <TaskSheet key={task.id} task={task} onClose={onClose} />;
};
