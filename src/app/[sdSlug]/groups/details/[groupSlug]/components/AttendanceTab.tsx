"use client";

import { GroupInterface, PersonInterface, SessionInterface } from "@churchapps/apphelper";
import { Grid } from "@mui/material";
import React from "react";
import { GroupSessions } from "./GroupSessions";
import { MembersAdd } from "./MembersAdd";
import { SessionAdd } from "./SessionAdd";

interface Props {
  group: GroupInterface
}

export function AttendanceTab(props: Props) {

  return <>
    <h2>Attendance</h2>
    <Grid container spacing={3}>
      <Grid item md={7}><GroupSessions group={props.group} sidebarVisibilityFunction={() => { }} addedSession={null} addedPerson={null} /></Grid>
      <Grid item md={5}><MembersAdd group={props.group} addFunction={() => { }} /></Grid>
      <Grid item md={5}><SessionAdd group={props.group} updatedFunction={() => { }} /></Grid></Grid>
  </>
}
