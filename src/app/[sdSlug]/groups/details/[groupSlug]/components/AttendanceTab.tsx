"use client";

import type { GroupInterface } from "@churchapps/helpers";
import { Grid } from "@mui/material";
import React, { useState } from "react";
import { GroupSessions } from "./GroupSessions";
import { MembersAdd } from "./MembersAdd";
import { SessionAdd } from "./SessionAdd";

interface Props {
  group: GroupInterface
}

export function AttendanceTab(props: Props) {
  const [addedPerson, setAddedPerson] = useState(null);
  const [addedSession, setAddedSession] = useState(null);
  const [hidden, setHidden] = useState("none");
  const [showing, setShowing] = useState("block");

  const hideAdd = () => {
    if (hidden === "none") {
      setShowing("none");
      setHidden("block");
    } else {
      setShowing("block");
      setHidden("none");
    }
    return;
  }

  return <>
    <h2>Attendance</h2>
    <Grid container spacing={3}>
      <Grid size={{ md: 7 }}><GroupSessions group={props.group} sidebarVisibilityFunction={hideAdd} addedSession={addedSession} addedPerson={addedPerson} /></Grid>
      <Grid size={{ md: 5 }} style={{ display: showing }}><MembersAdd group={props.group} addFunction={setAddedPerson} /></Grid>
      <Grid size={{ md: 5 }} style={{ display: hidden }}><SessionAdd group={props.group} updatedFunction={setAddedSession} sidebarVisibilityFunction={hideAdd} /></Grid></Grid>
  </>
}
