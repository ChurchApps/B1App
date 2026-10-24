"use client";

import React from "react";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import PrintIcon from "@mui/icons-material/PrintOutlined";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { useQuery } from "@tanstack/react-query";
import { mobileTheme } from "../mobileTheme";
import { PlateSection, QuietEmpty, Row, RowList, Sheet, TextLink } from "../kit";

const tc = mobileTheme.colors;

// A stand-alone form linked to the group (forms.groupId). Members see the open ones; leaders also see closed ones.
export interface LinkedForm { id: string; name?: string; description?: string; open?: boolean }

interface Question { id: string; title?: string; fieldType?: string; choices?: { value?: string; text?: string }[] }
interface Submission { id: string; submissionDate?: string; personName?: string | null; answers?: { questionId?: string; value?: string }[] }
// Leader-only: answers to a linked form, or to the registration form of one of the group's events.
export interface GroupFormAnswers {
  form: { id: string; name?: string };
  event?: { id: string; title?: string; start?: string };
  questions: Question[];
  submissions: Submission[];
}

export const useLinkedForms = (groupId: string, enabled: boolean) => useQuery<LinkedForm[]>({
  queryKey: ["group-forms", groupId],
  queryFn: async () => {
    const data = await ApiHelper.get(`/forms/group/${groupId}`, "MembershipApi");
    return Array.isArray(data) ? data : [];
  },
  enabled: !!groupId && enabled
});

export const useGroupFormAnswers = (groupId: string, isLeader: boolean) => useQuery<GroupFormAnswers[]>({
  queryKey: ["group-form-answers", groupId],
  queryFn: async () => {
    const data = await ApiHelper.get(`/formsubmissions/group/${groupId}`, "MembershipApi");
    return Array.isArray(data) ? data : [];
  },
  enabled: !!groupId && isLeader
});

const keyOf = (a: GroupFormAnswers) => a.event ? `e-${a.event.id}` : `f-${a.form.id}`;
const titleOf = (a: GroupFormAnswers) => a.event?.title || a.form.name || "";
const answerCount = (n: number) => n === 1 ? Locale.label("mobile.group.answerCountOne") : Locale.label("mobile.group.answerCount").replace("{}", String(n));
const submitterOf = (s: Submission) => s.personName || Locale.label("mobile.group.anonymous");
const submittedOn = (s: Submission) => s.submissionDate ? DateHelper.prettyDate(new Date(s.submissionDate)) : "";

const displayAnswer = (q: Question, s: Submission) => {
  const value = s.answers?.find((a) => a.questionId === q.id)?.value || "";
  if (!value || !q.choices?.length) return value;
  const values = q.fieldType === "Checkbox" ? value.split(",") : [value];
  return values.map((v) => q.choices!.find((c) => c.value === v)?.text || v).join(", ");
};

// The church's name and light-background logo, printed as a centered letterhead.
export interface PrintChurch { name?: string; logoUrl?: string }

// Prints through a hidden frame so only the answers reach the printer, not the app around them.
const printAnswers = (church: PrintChurch, title: string, items: { heading: string; rows: { label: string; value: string }[] }[]) => {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, { position: "fixed", width: "0", height: "0", border: "0", right: "0", bottom: "0" });
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) { frame.remove(); return; }
  doc.title = title;
  const style = doc.createElement("style");
  style.textContent = "body{font-family:sans-serif;margin:24px;color:#000}header{text-align:center;margin-bottom:16px}header img{display:block;margin:0 auto 8px;max-height:70px;max-width:240px;object-fit:contain}header p{font-size:16px;font-weight:600;margin:0}h1{font-size:20px;text-align:center}h2{font-size:16px;margin:24px 0 8px;break-after:avoid}dl{margin:0}dt{color:#555;font-weight:600;margin-top:12px}dd{margin:2px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}section{break-inside:avoid}";
  doc.head.appendChild(style);
  let logo: HTMLImageElement | null = null;
  if (church.logoUrl || church.name) {
    const header = doc.createElement("header");
    if (church.logoUrl) {
      logo = doc.createElement("img");
      logo.src = church.logoUrl;
      logo.alt = church.name || "";
      header.appendChild(logo);
    }
    if (church.name) {
      const name = doc.createElement("p");
      name.textContent = church.name;
      header.appendChild(name);
    }
    doc.body.appendChild(header);
  }
  const h1 = doc.createElement("h1");
  h1.textContent = title;
  doc.body.appendChild(h1);
  items.forEach((item) => {
    const section = doc.createElement("section");
    const h2 = doc.createElement("h2");
    h2.textContent = item.heading;
    const dl = doc.createElement("dl");
    item.rows.forEach((r) => {
      const dt = doc.createElement("dt");
      dt.textContent = r.label;
      const dd = doc.createElement("dd");
      dd.textContent = r.value || "—";
      dl.append(dt, dd);
    });
    section.append(h2, dl);
    doc.body.appendChild(section);
  });
  win.addEventListener("afterprint", () => frame.remove());
  const print = () => { win.focus(); win.print(); };
  // Wait for the logo (or 3s) so it makes it onto the page.
  if (!logo || logo.complete) { print(); return; }
  let done = false;
  const finish = () => { if (!done) { done = true; print(); } };
  logo.onload = finish;
  logo.onerror = finish;
  setTimeout(finish, 3000);
};

const printItem = (a: GroupFormAnswers, s: Submission) => ({
  heading: [submitterOf(s), submittedOn(s)].filter(Boolean).join(" · "),
  rows: a.questions.map((q) => ({ label: q.title || "", value: displayAnswer(q, s) }))
});

export const FillOutButton = ({ formId }: { formId: string }) => (
  <Button size="small" variant="outlined" href={`/forms/${formId}`} data-testid={`group-form-fill-${formId}`} sx={{ flex: "none" }}>
    {Locale.label("mobile.group.fillOut")}
  </Button>
);

// The group-page teaser: linked forms with "Fill out" for everyone, answer counts for leaders.
export const GroupFormsList = ({ forms, answers, onOpen, limit }: { forms: LinkedForm[]; answers?: GroupFormAnswers[]; onOpen?: (key: string) => void; limit?: number }) => {
  const rows = [
    ...forms.map((f) => {
      const a = answers?.find((x) => !x.event && x.form.id === f.id);
      const subtitle = [f.open ? "" : Locale.label("mobile.group.formClosed"), a ? answerCount(a.submissions.length) : ""].filter(Boolean).join(" · ");
      return { key: `f-${f.id}`, title: f.name || "", subtitle, formId: f.open ? f.id : "", openable: !!a };
    }),
    ...(answers || []).filter((a) => a.event).map((a) => ({
      key: keyOf(a),
      title: titleOf(a),
      subtitle: `${Locale.label("mobile.group.eventRegistration")} · ${answerCount(a.submissions.length)}`,
      formId: "",
      openable: true
    }))
  ].slice(0, limit);
  if (rows.length === 0) return <QuietEmpty>{Locale.label("mobile.group.noForms")}</QuietEmpty>;
  return (
    <RowList>
      {rows.map((r) => (
        <Row
          key={r.key}
          data-testid="group-form-row"
          onClick={r.openable && onOpen ? () => onOpen(r.key) : undefined}
          title={r.title}
          subtitle={r.subtitle || undefined}
          trailing={r.formId ? <Box onClick={(e) => e.stopPropagation()}><FillOutButton formId={r.formId} /></Box> : undefined}
          chevron={r.openable && !!onOpen}
        />
      ))}
    </RowList>
  );
};

// The Forms slice. Leaders pick a form or event to read and print its answers.
export const GroupFormsTab = ({ groupId, isLeader, forms, initialKey, church = {} }: { groupId: string; isLeader: boolean; forms: LinkedForm[]; initialKey?: string; church?: PrintChurch }) => {
  const { data: answers, isLoading } = useGroupFormAnswers(groupId, isLeader);
  const [selectedKey, setSelectedKey] = React.useState<string | undefined>(initialKey);
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const selected = answers?.find((a) => keyOf(a) === selectedKey);

  if (isLeader && isLoading) return <PlateSection><Skeleton variant="rounded" height={56} /></PlateSection>;

  if (!selected) {
    return (
      <PlateSection>
        <GroupFormsList forms={forms} answers={isLeader ? answers : undefined} onOpen={isLeader ? setSelectedKey : undefined} />
      </PlateSection>
    );
  }

  const title = titleOf(selected);
  const linked = !selected.event ? forms.find((f) => f.id === selected.form.id) : undefined;
  return (
    <>
      <PlateSection
        title={title}
        action={(
          <Box sx={{ display: "flex", gap: "16px" }}>
            <TextLink onClick={() => setSelectedKey(undefined)}>{Locale.label("mobile.group.allForms")}</TextLink>
            {selected.submissions.length > 0 && (
              <TextLink onClick={() => printAnswers(church, title, selected.submissions.map((s) => printItem(selected, s)))} data-testid="group-form-print-all">{Locale.label("mobile.group.printAll")}</TextLink>
            )}
          </Box>
        )}
      >
        {selected.event && <Typography sx={{ mb: "8px", fontSize: 14, color: tc.textSecondary }}>{Locale.label("mobile.group.eventRegistration")}</Typography>}
        {linked?.open && <Box sx={{ mb: "8px" }}><FillOutButton formId={linked.id} /></Box>}
        {selected.submissions.length === 0 ? <QuietEmpty>{Locale.label("mobile.group.noAnswersYet")}</QuietEmpty> : (
          <RowList>
            {selected.submissions.map((s) => (
              <Row key={s.id} data-testid="group-form-submission" onClick={() => setSubmission(s)} title={submitterOf(s)} subtitle={submittedOn(s) || undefined} chevron />
            ))}
          </RowList>
        )}
      </PlateSection>
      <Sheet
        open={!!submission}
        onClose={() => setSubmission(null)}
        title={submission ? `${title} · ${submitterOf(submission)}` : ""}
        actions={(
          <>
            <Button variant="outlined" onClick={() => setSubmission(null)}>{Locale.label("common.close")}</Button>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={() => submission && printAnswers(church, title, [printItem(selected, submission)])} data-testid="group-form-print">
              {Locale.label("mobile.group.print")}
            </Button>
          </>
        )}
      >
        {submission && (
          <Box data-testid="group-form-answers">
            {submittedOn(submission) && <Typography sx={{ mb: "12px", fontSize: 14, color: tc.textSecondary }}>{submittedOn(submission)}</Typography>}
            {/* Question above answer: long questions in a side-by-side grid squeezed the answer to one letter wide (#1352). */}
            <Box component="dl" sx={{ m: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              {selected.questions.map((q) => (
                <Box key={q.id}>
                  <Typography component="dt" sx={{ fontSize: 13.5, color: tc.textSecondary }}>{q.title}</Typography>
                  <Typography component="dd" sx={{ m: 0, fontSize: 15, color: tc.text, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{displayAnswer(q, submission) || "—"}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Sheet>
    </>
  );
};
