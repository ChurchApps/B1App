"use client";

import { useState, useEffect, useContext } from "react";
import { Grid, Container } from "@mui/material";
import { ApiHelper, UserHelper, Locale } from "@churchapps/apphelper";
import { MarkdownPreviewLight } from "@churchapps/apphelper/markdown";
import { DisplayBox } from "@churchapps/apphelper";
import type { GroupInterface, PlanInterface } from "@churchapps/helpers";
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
import { ConversationsTab } from "./ConversationsTab";
import { PlansTab } from "./PlansTab";

interface Props {
  config: ConfigurationInterface;
  group: GroupInterface;
  addedCallback?: () => void;
}

export function AuthenticatedView(props: Props) {
  const [tab, setTab] = useState("details");
  const [group, setGroup] = useState(props.group);
  const [plans, setPlans] = useState<PlanInterface[] | null>(null);
  const context = useContext(UserContext);

  useEffect(() => {
    setGroup(props.group);
  }, [props.group]);

  useEffect(() => {
    if (!group?.id) return;
    ApiHelper.get(`/groups/${group.id}/plans`, "MembershipApi")
      .then((data: PlanInterface[]) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]));
  }, [group?.id]);

  let isLeader = false;
  UserHelper.currentUserChurch.groups?.forEach((g) => {
    if (g.id === group?.id && g.leader) isLeader = true;
  });

  const canEditGroup = isLeader || UserHelper.checkAccess(Permissions.membershipApi.groups.edit);
  const canEditMembers = isLeader || UserHelper.checkAccess(Permissions.membershipApi.groupMembers.edit);

  const handleChange = (g: GroupInterface) => {
    setGroup(g);
  };

  const getTabContent = () => {
    let result = <></>;
    switch (tab) {
      case "details":
        result = <>
          {canEditGroup && <LeaderEdit group={group} config={props.config} onChange={handleChange} updatedFunction={handleChange} />}
          <h2>{Locale.label("groupsPage.details")}</h2>
          <div style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
            <MarkdownPreviewLight value={group.about} />
          </div>
        </>;
        break;
      case "calendar": result = <><h2>{Locale.label("groupsPage.calendar")}</h2><DisplayBox headerText={Locale.label("groupsPage.groupCalendar")}><GroupCalendar groupId={group.id} churchId={props.config.church.id} canEdit={canEditGroup} /></DisplayBox></>; break;
      case "conversations": result = <ConversationsTab context={context} groupId={group.id} isLeader={isLeader} />; break;
      case "resources": result = <><h2>{Locale.label("groupsPage.resources")}</h2><GroupResources context={context} groupId={group.id} /></>; break;
      case "leaderResources": result = <><h2>{Locale.label("groupsPage.resourcesLeadersOnly")}</h2><GroupLeaderResources context={context} groupId={group.id} /></>; break;
      case "members": result = <MembersTab isLeader={isLeader} canEditMembers={canEditMembers} group={group} />; break;
      case "attendance": result = <AttendanceTab group={group} />; break;
      case "plans": result = <PlansTab groupId={group.id} sdSlug={props.config.church.subDomain || ""} />; break;
    }
    return result;
  };

  return (
    <>
      <GroupHero group={group} />
      <Container>
        <div id="mainContent">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 2 }}>
              <div className="sideNav">
                <GroupTabs config={props.config} onTabChange={(val: string) => { setTab(val); }} group={group} hasPlans={plans !== null && plans.length > 0} />
              </div>
            </Grid>
            <Grid size={{ xs: 12, md: 10 }}>
              {group
                ? (<>{getTabContent()}</>)
                : (<p>{Locale.label("groupsPage.noGroupData")}</p>)}
            </Grid>
          </Grid>
        </div>

      </Container>
    </>
  );
}
