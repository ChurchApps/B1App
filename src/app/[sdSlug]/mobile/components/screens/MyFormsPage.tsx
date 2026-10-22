"use client";

import React, { useContext } from "react";
import { Box, Skeleton, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { DateHelper, Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { LoadErrorAlert } from "../LoadErrorAlert";
import { BackVerb, PageHead, Plate, PlateSection, QuietEmpty, Row } from "../kit";
import { useMyFormSubmissions, type MyFormSubmission } from "../../helpers/myRecords";

interface Props {
  config: ConfigurationInterface;
}

const tc = mobileTheme.colors;

// Read-only: members can review what they submitted but not change or delete it.
const SubmissionAnswers = ({ submission }: { submission: MyFormSubmission }) => {
  const answered = (submission.questions || [])
    .map((q) => ({ question: q, answer: (submission.answers || []).find((a) => a.questionId === q.id) }))
    .filter((qa) => qa.answer?.value);
  if (answered.length === 0) return <QuietEmpty sx={{ pb: "10px" }}>{Locale.label("mobile.me.noAnswers")}</QuietEmpty>;
  return (
    <Box component="dl" data-testid={`my-form-answers-${submission.id}`} sx={{ m: 0, pb: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {answered.map(({ question, answer }) => (
        <Box key={question.id}>
          <Typography component="dt" sx={{ fontSize: 13.5, color: tc.textSecondary }}>{question.title}</Typography>
          <Typography component="dd" sx={{ m: 0, fontSize: 15, color: tc.text, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{answer?.value}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export const MyFormsPage = (_props: Props) => {
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const { data: submissions = null, isError, refetch } = useMyFormSubmissions(loggedIn);
  const [openId, setOpenId] = React.useState<string | null>(null);

  return (
    <Box sx={{ pb: "24px" }}>
      <BackVerb label={Locale.label("mobile.me.backToMe")} href="/mobile/me" />
      <PageHead title={Locale.label("mobile.me.myForms")} lede={Locale.label("mobile.me.myFormsLede")} />
      {submissions === null && isError && <Box sx={{ mx: { xs: "12px", md: 0 }, mb: "12px" }}><LoadErrorAlert onRetry={() => refetch()} /></Box>}
      <Plate>
        <PlateSection>
          {submissions === null && !isError && [0, 1, 2].map((i) => <Skeleton key={i} variant="text" height={44} />)}
          {submissions !== null && submissions.length === 0 && <QuietEmpty>{Locale.label("mobile.me.noForms")}</QuietEmpty>}
          {submissions !== null && submissions.length > 0 && (
            <Box sx={{ "& > .form-item + .form-item": { borderTop: `1px solid ${tc.border}` } }}>
              {submissions.map((s) => {
                const open = openId === s.id;
                return (
                  <Box key={s.id} className="form-item">
                    <Row
                      data-testid="my-form-row"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : s.id || null)}
                      title={s.form?.name || Locale.label("mobile.me.form")}
                      subtitle={s.submissionDate ? DateHelper.prettyDate(new Date(s.submissionDate)) : undefined}
                      trailing={open ? <ExpandLessIcon sx={{ color: tc.textSecondary }} /> : <ExpandMoreIcon sx={{ color: tc.textSecondary }} />}
                    />
                    {open && <SubmissionAnswers submission={s} />}
                  </Box>
                );
              })}
            </Box>
          )}
        </PlateSection>
      </Plate>
    </Box>
  );
};

export default MyFormsPage;
