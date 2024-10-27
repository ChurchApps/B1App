"use client";

import { Wrapper } from "@/components";
import MyGroups from "@/components/member/timeline/MyGroups";
import { Timeline } from "@/components/member/timeline/Timeline";
import { Grid } from "@mui/material";
import Link from "next/link";
import { useContext } from "react";
import UserContext from "@/context/UserContext";

import { ApiHelper } from "@churchapps/apphelper";

export function MemberClientWrapper({ config }:any) {
  const context = useContext(UserContext);


  if (!ApiHelper.isAuthenticated) {
    return (
      <Wrapper config={config}>
        <h1>Member Portal</h1>
        <p>Select an option on the left or <Link href="/login/?returnUrl=/member/groups">Login</Link>.</p>
      </Wrapper>
    );
  }

  return (
    <Wrapper config={config}>
      <h1>Latest Updates</h1>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <div style={{ maxWidth: 750, marginLeft: "auto", marginRight: "auto" }}>
            <Timeline context={context} />
          </div>
        </Grid>
        <Grid item xs={12} md={4}>
          <MyGroups />
        </Grid>
      </Grid>
    </Wrapper>
  );
}
