"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { ApiHelper, DateHelper, Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { useQuery } from "@tanstack/react-query";
import type { PlanInterface } from "@churchapps/helpers";
import { mobileTheme } from "../mobileTheme";
import { Eyebrow, PlateSection, Thumb } from "../kit";

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

  const line = (label: string, value: string) => (
    <Typography sx={{ fontSize: 15, lineHeight: "22px", color: tc.text, mt: "4px" }}>
      <Box component="span" sx={{ fontWeight: 600 }}>{label}:</Box> {value}
    </Typography>
  );

  return (
    <PlateSection>
      <Box data-testid="group-lesson-take-home">
        <Box sx={{ mb: "10px" }}><Eyebrow>{Locale.label("mobile.details.thisWeeksLesson")}</Eyebrow></Box>
        <Box sx={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          {lesson.image && <Thumb src={lesson.image} alt={title} width={96} height={54} />}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {title && <Typography sx={{ fontSize: 17, lineHeight: "24px", fontWeight: 600, color: tc.text }}>{title}</Typography>}
            {dateLabel && <Typography sx={{ fontSize: 13.5, lineHeight: "19px", color: tc.textSecondary }}>{dateLabel}</Typography>}
          </Box>
        </Box>
        <Box sx={{ mt: "8px" }}>
          {lesson.bottomLine && line(Locale.label("mobile.details.bottomLine"), lesson.bottomLine)}
          {lesson.verse && line(Locale.label("mobile.details.verse"), lesson.verse)}
          {lesson.parentQuestion && line(Locale.label("mobile.details.parentQuestion"), lesson.parentQuestion)}
          {lesson.parentNote && (
            <Box sx={{ fontSize: 15, lineHeight: "22px", color: tc.textSecondary, mt: "6px", "& p": { mt: 0, mb: 1 }, "& p:last-child": { mb: 0 } }}>
              <MarkdownPreviewLight value={lesson.parentNote} />
            </Box>
          )}
        </Box>
      </Box>
    </PlateSection>
  );
};
