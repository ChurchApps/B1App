"use client";

import { useState, useEffect } from "react";
import { DisplayBox, Loading, ApiHelper, CuratedCalendarInterface, SmallButton } from "@churchapps/apphelper";
import { redirect } from "next/navigation";
import { Grid, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { CalendarEdit } from "@/components/admin/calendar/CalendarEdit";
import { WrapperPageProps } from "@/helpers";

export function CalendarsClientWrapper(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;

  const [calendars, setCalendars] = useState<CuratedCalendarInterface[]>(null);
  const [currentCalendar, setCurrentCalendar] = useState<CuratedCalendarInterface>(null);

  const loadData = () => {
    if (!isAuthenticated) {
      redirect("/login");
    }
    ApiHelper.get("/curatedCalendars", "ContentApi").then((data) => {
      setCalendars(data);
    });
  };

  const getRows = () => {
    let rows: JSX.Element[] = [];
    calendars?.forEach((calendar) => {
      rows.push(
        <TableRow key={calendar.id}>
          <TableCell>{calendar.name}</TableCell>
          <TableCell style={{ textAlign: "right" }}>
            <SmallButton
              icon="calendar_month"
              toolTip="Manage Events"
              onClick={() => {
                redirect("/admin/calendars/" + calendar.id);
              }}
            />
            <SmallButton
              icon="edit"
              toolTip="Edit"
              onClick={() => {
                setCurrentCalendar(calendar);
              }}
            />
          </TableCell>
        </TableRow>
      );
    });
    return rows;
  };

  const getTable = () => {
    if (calendars === null) return <Loading />;
    else
      return (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Calendar</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{getRows()}</TableBody>
        </Table>
      );
  };

  const getEditContent = () => (
    <SmallButton
      icon="add"
      onClick={() => {
        setCurrentCalendar({});
      }}
    />
  );

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminWrapper config={props.config}>
      <h1>Curated Calendars</h1>
      <Grid container spacing={3}>
        <Grid item md={8} xs={12}>
          <DisplayBox
            headerIcon="calendar_month"
            headerText="Curated Calendars"
            editContent={getEditContent()}
            id="calendarsBox"
          >
            {getTable()}
          </DisplayBox>
        </Grid>
        <Grid item md={4} xs={12}>
          {currentCalendar && (
            <CalendarEdit
              calendar={currentCalendar}
              updatedCallback={() => {
                setCurrentCalendar(null);
                loadData();
              }}
            />
          )}
        </Grid>
      </Grid>
      <h3>About Curated Calendars</h3>
      <p>
                Each group has its own calendar which can be managed by group leaders from the group page. However, you can
                also create curated calendars which can be shared with the entire church.
      </p>
      <p>
                For example, you might want to create a calendar for all of the church's small groups, or a calendar for all of
                the church's youth events. You may also wish to create a whole church events calendar which highlights the
                bigger events without including minor events from each group.
      </p>
      <p>
                You can create as many curated calendars as you like, and you can add events from any group to any curated
                calendar.
      </p>
    </AdminWrapper>
  );
}
