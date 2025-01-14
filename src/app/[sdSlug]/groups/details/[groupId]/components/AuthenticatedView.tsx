"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { Grid, Table, TableBody, TableCell, TableRow, Container } from "@mui/material";
import { GroupInterface, ApiHelper, UserHelper, PersonHelper, MarkdownPreviewLight, Conversations, DisplayBox, Loading } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { GroupCalendar } from "@/components/eventCalendar/GroupCalendar";
import { GroupFiles } from "@/components/groups/GroupFiles";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { GroupHero } from "./GroupHero";
import { GroupTabs } from "./GroupTabs";

interface Props {
  config: ConfigurationInterface;
  group: GroupInterface
}

export function AuthenticatedView(props: Props) {
  const [groupMembers, setGroupMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState("details");

  const context = useContext(UserContext);

  const loadData = () => {
    setIsLoading(true);

    ApiHelper.get(`/groupmembers?groupId=${props.group.id}`, "MembershipApi")
      .then((data) => setGroupMembers(data))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { loadData(); }, [props.group]);


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
    if (g.id === props.group?.id && g.leader) isLeader = true;
  });

  const getTabContent = () => {
    console.log("Tab is", tab)
    let result = <></>
    switch (tab) {
      case "details":
        result = <><h2>Details</h2><div style={{ paddingTop: "1rem", paddingBottom: "3rem" }}><MarkdownPreviewLight value={props.group.about} /></div></>
        break;
      case "calendar":
        result = <><h2>Calendar</h2><DisplayBox headerText="Group Calendar"><GroupCalendar groupId={props.group.id} churchId={props.config.church.id} canEdit={isLeader} /></DisplayBox></>
        break;
      case "conversations":
        result = <><h2>Conversations</h2><Conversations context={context} contentType="group" contentId={props.group.id} groupId={props.group.id} /></>
        break;
      case "files":
        result = <><h2>Files</h2><GroupFiles context={context} groupId={props.group.id} /></>
        break;
      case "members":
        result = <><h2>Members</h2><DisplayBox id="groupMembersBox" headerText="Group Members" headerIcon="group">{getTable()}</DisplayBox></>
        break;
    }
    return result;
  }

  return (
    <>
      <GroupHero group={props.group} />
      <Container>
        <div id="mainContent">
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <div className="sideNav" style={{height:"100vh", borderRight:"1px solid #CCC" }}>
                <GroupTabs config={props.config} onTabChange={(val:string) => { setTab(val) }} />
              </div>
            </Grid>
            <Grid item xs={12} md={10}>
              {props.group
                ? (<>{getTabContent()}</>)
                : (<p>No group data found</p>)}



            </Grid>
          </Grid>
        </div>



      </Container>
    </>
  );
}
