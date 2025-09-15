"use client";

import { useState, useEffect, useContext } from "react";
import { Grid, Container } from "@mui/material";
import { UserHelper } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper-markdown";
import { Conversations } from "@/components/notes/Conversations";
import { DisplayBox } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import { Permissions } from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { GroupCalendar } from "@/components/eventCalendar/GroupCalendar";
import { GroupResources } from "@/components/groups/GroupResources";
import { GroupLeaderResources } from "@/components/groups/GroupLeaderResources";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { GroupHero } from "./GroupHero";
import { GroupTabs } from "./GroupTabs";
import { LeaderEdit } from "./LeaderEdit";
import React from "react";
import { MembersTab } from "./MembersTab";
import { AttendanceTab } from "./AttendanceTab";

interface Props {
  config: ConfigurationInterface;
  group: GroupInterface;
  addedCallback?: () => void;
}

export function AuthenticatedView(props: Props) {
  const [tab, setTab] = useState("details");
  const [group, setGroup] = useState(props.group);
  const context = useContext(UserContext);

  useEffect(() => {
    setGroup(props.group);
  }, [props.group]);

  let isLeader = false;
  UserHelper.currentUserChurch.groups?.forEach((g) => {
    if (g.id === group?.id && g.leader) isLeader = true;
  });

  const canEditGroup = isLeader || UserHelper.checkAccess(Permissions.membershipApi.groups.edit);
  const canEditMembers = isLeader || UserHelper.checkAccess(Permissions.membershipApi.groupMembers.edit);

  const handleChange = (g: GroupInterface) => {
    setGroup(g);
  }

  const getTabContent = () => {
    let result = <></>
    switch (tab) {
      case "details":
        result = <>
          {canEditGroup && <LeaderEdit group={group} config={props.config} onChange={handleChange} updatedFunction={handleChange} />}
          <h2>Details</h2>
          <div style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
            <MarkdownPreviewLight value={group.about} />
          </div>
        </>
        break;
      case "calendar":
        result = <><h2>Calendar</h2><DisplayBox headerText="Group Calendar"><GroupCalendar groupId={group.id} churchId={props.config.church.id} canEdit={canEditGroup} /></DisplayBox></>
        break;
      case "conversations":
        result = <><h2>Conversations</h2><Conversations context={context} contentType="group" contentId={group.id} groupId={group.id} /></>
        break;
      case "resources":
        result = <><h2>Resources</h2><GroupResources context={context} groupId={group.id} /></>
        break;
      case "leaderResources":
        result = <><h2>Resources (Leaders Only)</h2><GroupLeaderResources context={context} groupId={group.id} /></>
        break;
      case "members":
        result = <MembersTab isLeader={isLeader} canEditMembers={canEditMembers} group={group} />
        break;
      case "attendance":
        result = <AttendanceTab group={group} />
        break;
    }
    return result;
  }

  return (
    <>
      <GroupHero group={group} />
      <Container>
        <div id="mainContent">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 2 }}>
              <div className="sideNav">
                <GroupTabs config={props.config} onTabChange={(val: string) => { setTab(val) }} group={group} />
              </div>
            </Grid>
            <Grid size={{ xs: 12, md: 10 }}>
              {group
                ? (<>{getTabContent()}</>)
                : (<p>No group data found</p>)}
            </Grid>
          </Grid>
        </div>

      </Container>
    </>
  );
}
