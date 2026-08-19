"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { useQuery } from "@tanstack/react-query";
import type { PlanInterface } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";

interface Props {
  isMember: boolean;
  plans: PlanInterface[];
}

interface TakeHomeLesson {
  id?: string;
  name?: string;
  title?: string;
  image?: string;
  bottomLine?: string;
  verse?: string;
  parentQuestion?: string;
  parentNote?: string;
}

type PlanWithProvider = PlanInterface & { providerId?: string; providerPlanId?: string };

const LESSONS_PATH = /^\/lessons\/[^/]+\/[^/]+\/([^/]+)\/[^/]+\/?$/;

function ymd(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function lessonIdFromPlan(plan: PlanWithProvider): string | null {
  if (plan.providerId !== "lessonschurch") return null;
  const match = String(plan.providerPlanId || "").match(LESSONS_PATH);
  return match ? match[1] : null;
}

function hasTakeHome(lesson: TakeHomeLesson) {
  return !!(lesson.bottomLine || lesson.verse || lesson.parentQuestion || lesson.parentNote);
}

export const GroupLessonTakeHome = ({ isMember, plans }: Props) => {
  const tc = mobileTheme.colors;
  const today = React.useMemo(() => todayYmd(), []);

  const candidates = React.useMemo(() => {
    return (plans as PlanWithProvider[])
      .map((plan) => ({ plan, lessonId: lessonIdFromPlan(plan), date: ymd(plan.serviceDate) }))
      .filter((row): row is { plan: PlanWithProvider; lessonId: string; date: string } => !!row.lessonId && !!row.date && row.date <= today)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [plans, today]);

  const ids = React.useMemo(() => Array.from(new Set(candidates.map((c) => c.lessonId))), [candidates]);

  const { data: lessons = [] } = useQuery<TakeHomeLesson[]>({
    queryKey: ["lesson-take-home", ids.join(",")],
    queryFn: async () => {
      const data = await ApiHelper.getAnonymous(`/lessons/public/ids?ids=${ids.join(",")}`, "LessonsApi");
      return Array.isArray(data) ? data : [];
    },
    enabled: isMember && ids.length > 0,
    placeholderData: []
  });

  if (!isMember) return null;

  const featured = candidates
    .map((row) => ({ ...row, lesson: lessons.find((l) => l.id === row.lessonId) }))
    .find((row) => row.lesson && hasTakeHome(row.lesson));

  if (!featured?.lesson) return null;

  const lesson = featured.lesson;
  const title = lesson.title || lesson.name || "";
  const dateLabel = featured.plan.serviceDate ? DateHelper.prettyDate(DateHelper.toDate(featured.plan.serviceDate as any)) : "";

  return (
    <Box
      data-testid="group-lesson-take-home"
      sx={{
        bgcolor: tc.surface,
        border: `1px solid ${tc.border}`,
        borderRadius: `${mobileTheme.radius.lg}px`,
        p: `${mobileTheme.spacing.md}px`
      }}
    >
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: `${mobileTheme.spacing.sm}px` }}>
        {Locale.label("mobile.details.thisWeeksLesson")}
      </Typography>
      {lesson.image && (
        <Box
          component="img"
          src={lesson.image}
          alt={title}
          sx={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: `${mobileTheme.radius.md}px`, mb: `${mobileTheme.spacing.sm}px` }}
        />
      )}
      {title && (
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>{title}</Typography>
      )}
      {dateLabel && (
        <Typography sx={{ fontSize: 13, color: tc.textSecondary, mb: `${mobileTheme.spacing.sm}px` }}>{dateLabel}</Typography>
      )}
      {lesson.bottomLine && (
        <Typography sx={{ fontSize: 14, color: tc.text, mb: 0.5 }}>
          <strong>{Locale.label("mobile.details.bottomLine")}:</strong> {lesson.bottomLine}
        </Typography>
      )}
      {lesson.verse && (
        <Typography sx={{ fontSize: 14, color: tc.text, mb: 0.5 }}>
          <strong>{Locale.label("mobile.details.verse")}:</strong> {lesson.verse}
        </Typography>
      )}
      {lesson.parentQuestion && (
        <Typography sx={{ fontSize: 14, color: tc.text, mb: 0.5 }}>
          <strong>{Locale.label("mobile.details.parentQuestion")}:</strong> {lesson.parentQuestion}
        </Typography>
      )}
      {lesson.parentNote && (
        <Box sx={{ fontSize: 14, color: tc.textMuted, mt: 0.5, "& p": { mt: 0, mb: 1 }, "& p:last-child": { mb: 0 } }}>
          <MarkdownPreviewLight value={lesson.parentNote} />
        </Box>
      )}
    </Box>
  );
};
