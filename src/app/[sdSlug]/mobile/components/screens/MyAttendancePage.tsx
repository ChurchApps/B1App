"use client";

import React, { useContext, useMemo } from "react";
import { Box, Skeleton } from "@mui/material";
import { Locale } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { LoadErrorAlert } from "../LoadErrorAlert";
import { BackVerb, PageHead, Plate, PlateSection, QuietEmpty, Row, RowList } from "../kit";
import { attendanceSubtitle, attendanceTitle, useMyAttendance, useMyGroups, type MyAttendanceRecord } from "../../helpers/myRecords";

interface Props {
  config: ConfigurationInterface;
}

export const MyAttendancePage = (_props: Props) => {
  const context = useContext(UserContext);
  const loggedIn = !!context?.user?.firstName;
  const { data: records = null, isError, refetch } = useMyAttendance(loggedIn);
  const { data: groups = [] } = useMyGroups(loggedIn, context?.user?.id);

  // The Api returns newest first; keep that order within each month.
  const months = useMemo(() => {
    const result: { key: string; label: string; items: MyAttendanceRecord[] }[] = [];
    (records || []).forEach((r) => {
      if (!r.visitDate) return;
      const d = new Date(r.visitDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      let month = result.find((m) => m.key === key);
      if (!month) {
        month = { key, label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }), items: [] };
        result.push(month);
      }
      month.items.push(r);
    });
    return result;
  }, [records]);

  return (
    <Box sx={{ pb: "24px" }}>
      <BackVerb label={Locale.label("mobile.me.backToMe")} href="/mobile/me" />
      <PageHead title={Locale.label("mobile.me.myAttendance")} lede={Locale.label("mobile.me.myAttendanceLede")} />
      {records === null && isError && <Box sx={{ mx: { xs: "12px", md: 0 }, mb: "12px" }}><LoadErrorAlert onRetry={() => refetch()} /></Box>}
      <Plate>
        {records === null && !isError && <PlateSection>{[0, 1, 2].map((i) => <Skeleton key={i} variant="text" height={44} />)}</PlateSection>}
        {records !== null && months.length === 0 && <PlateSection><QuietEmpty>{Locale.label("mobile.me.noAttendance")}</QuietEmpty></PlateSection>}
        {months.map((m) => (
          <PlateSection key={m.key} title={m.label}>
            <RowList>
              {m.items.map((r, idx) => (
                <Row key={idx} data-testid="my-attendance-row" title={attendanceTitle(r, groups)} subtitle={attendanceSubtitle(r, groups)} />
              ))}
            </RowList>
          </PlateSection>
        ))}
      </Plate>
    </Box>
  );
};

export default MyAttendancePage;
