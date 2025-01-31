"use client";

import { useState, useEffect, useContext } from "react";
import { Grid, Container } from "@mui/material";
import { GroupInterface, UserHelper, MarkdownPreviewLight, Conversations, DisplayBox, PersonInterface, SessionInterface } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { GroupCalendar } from "@/components/eventCalendar/GroupCalendar";
import { GroupFiles } from "@/components/groups/GroupFiles";
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

  const handleChange = (g: GroupInterface) => {
    setGroup(g);
  }

  const getTabContent = () => {
    console.log("Tab is", tab)
    let result = <></>
    switch (tab) {
      case "details":
        result = <>
          {isLeader && <LeaderEdit group={group} config={props.config} onChange={handleChange} updatedFunction={handleChange} />}
          <h2>Details</h2>
          <div style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
            <MarkdownPreviewLight value={group.about} />
          </div>
        </>
        break;
      case "calendar":
        result = <><h2>Calendar</h2><DisplayBox headerText="Group Calendar"><GroupCalendar groupId={group.id} churchId={props.config.church.id} canEdit={isLeader} /></DisplayBox></>
        break;
      case "conversations":
        result = <><h2>Conversations</h2><Conversations context={context} contentType="group" contentId={group.id} groupId={group.id} /></>
        break;
      case "files":
        result = <><h2>Files</h2><GroupFiles context={context} groupId={group.id} /></>
        break;
      case "members":
        result = <MembersTab isLeader={isLeader} group={group} />
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
            <Grid item xs={12} md={2}>
              <div className="sideNav">
                <GroupTabs config={props.config} onTabChange={(val: string) => { setTab(val) }} />
              </div>
            </Grid>
            <Grid item xs={12} md={10}>
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
