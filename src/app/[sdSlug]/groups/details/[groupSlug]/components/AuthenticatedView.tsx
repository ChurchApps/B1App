"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { Grid, Table, TableBody, TableCell, TableRow, Container } from "@mui/material";
import { GroupInterface, ApiHelper, UserHelper, PersonHelper, MarkdownPreviewLight, Conversations, DisplayBox, Loading, PersonInterface, SmallButton, GroupMemberInterface, SessionInterface } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { GroupCalendar } from "@/components/eventCalendar/GroupCalendar";
import { GroupFiles } from "@/components/groups/GroupFiles";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { GroupHero } from "./GroupHero";
import { GroupTabs } from "./GroupTabs";
import { LeaderEdit } from "./LeaderEdit";
import React from "react";
import { PersonAdd } from "./PersonAdd";
import { GroupSessions } from "./GroupSessions";
import { SessionAdd } from "./SessionAdd";
import { MembersAdd } from "./MembersAdd";

interface Props {
  config: ConfigurationInterface;
  group: GroupInterface;
  addedCallback?: () => void;
  addedPerson?: PersonInterface,
  addedSession?: SessionInterface,
  sidebarVisibilityFunction: (name: string, visible: boolean) => void
}

export function AuthenticatedView(props: Props) {
  const [groupMembers, setGroupMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState("details");
  const [group, setGroup] = useState(props.group);

  const context = useContext(UserContext);

  const loadData = () => {
    setIsLoading(true);

    ApiHelper.get(`/groupmembers?groupId=${props.group.id}`, "MembershipApi")
      .then((data) => setGroupMembers(data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
    setGroup(props.group);
  }, [props.group]);

  const getMemberByPersonId = React.useCallback((personId: string) => {
    let result = null;
    for (let i = 0; i < groupMembers.length; i++) if (groupMembers[i].personId === personId) result = groupMembers[i];
    return result;
  }, [groupMembers]);

  const getRows = () => {
    let rows: JSX.Element[] = [];

    if (groupMembers.length === 0) {
      rows.push(<TableRow key="0"><TableCell>No group members found.</TableCell></TableRow>);
      return rows;
    }

    for (let i = 0; i < groupMembers.length; i++) {
      const gm = groupMembers[i];
      rows.push(
        <TableRow key={i}>
          <TableCell>
            <img src={PersonHelper.getPhotoUrl(gm.person)} alt="avatar" style={{ width: "50px", height: "40px", borderRadius: 8 }} />
          </TableCell>
          <TableCell>
            <Link href={`/member/directory/${gm.person.id}`}>{gm.person.name.display}</Link>
          </TableCell>
          {isLeader &&
            <TableCell style={{ textAlign: "right" }}>
              <SmallButton icon="person_remove" toolTip="Remove" onClick={() => handleRemove(gm)} color="error" />
            </TableCell>}
        </TableRow>
      );
    }
    return rows;
  };

  const getTable = () => {
    if (isLoading) return <Loading />;
    return (
      <Table id="groupMemberTable" size="small">
        <TableBody>{getRows()}</TableBody>
      </Table>
    );
  };

  let isLeader = false;
  UserHelper.currentUserChurch.groups?.forEach((g) => {
    if (g.id === group?.id && g.leader) isLeader = true;
  });

  const handleChange = (g: GroupInterface) => {
    setGroup(g);
  }

  const handleAdd = (addedPerson: PersonInterface) => {
    if (getMemberByPersonId(addedPerson.id) === null) {
      let gm = { groupId: props.group.id, personId: addedPerson.id, person: addedPerson } as GroupMemberInterface
      ApiHelper.post("/groupmembers", [gm], "MembershipApi").then((data) => {
        gm.id = data[0].id;
      });
      let members = [...groupMembers];
      members.push(gm);
      setGroupMembers(members);
      {/* props.addedCallback(); */ }
    }
  }

  const handleRemove = (member: GroupMemberInterface) => {
    let members = [...groupMembers];
    let idx = members.indexOf(member);
    members.splice(idx, 1);
    setGroupMembers(members);
    ApiHelper.delete("/groupmembers/" + member.id, "MembershipApi");
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
        result = <>{isLeader ?
          <><h2>Members</h2><Grid container spacing={3}><Grid item md={7}><DisplayBox id="groupMembersBox" headerText="Group Members" headerIcon="group">{getTable()}</DisplayBox></Grid><Grid item md={5}><PersonAdd addFunction={handleAdd} getPhotoUrl={PersonHelper.getPhotoUrl} /></Grid></Grid></> :
          <><h2>Members</h2><DisplayBox id="groupMembersBox" headerText="Group Members" headerIcon="group">{getTable()}</DisplayBox></>
        }</>
        break;
      case "attendance":
        result = <><h2>Attendance</h2><Grid container spacing={3}><Grid item md={7}><GroupSessions group={group} sidebarVisibilityFunction={props.sidebarVisibilityFunction} addedSession={props.addedSession} addedPerson={props.addedPerson} /></Grid><Grid item md={5}><MembersAdd group={group} addFunction={handleAdd} /></Grid><Grid item md={5}><SessionAdd group={group} updatedFunction={loadData} /></Grid></Grid></>
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
