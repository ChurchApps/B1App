"use client";

import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { Grid, Box, Table, TableBody, TableCell, TableRow, Tab, Tabs, Container } from "@mui/material";
import { GroupInterface, ApiHelper, UserHelper, PersonHelper, MarkdownPreviewLight, Conversations, DisplayBox, Loading } from "@churchapps/apphelper";
import UserContext from "@/context/UserContext";
import { GroupCalendar } from "@/components/eventCalendar/GroupCalendar";
import { TabContext, TabPanel } from "@mui/lab";
import { GroupTimeline } from "@/components/member/timeline/GroupTimeline";
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
  const [tabIndex, setTabIndex] = useState("0");

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

  return (
    <>
      <GroupHero group={props.group} />
      <Container>
        <div id="mainContent">
          <Grid container spacing={2}>
            <Grid item xs={12} md={2}>
              <div className="sideNav" style={{height:"100vh", borderRight:"1px solid #CCC" }}>
                <GroupTabs config={props.config} />
              </div>
            </Grid>
            <Grid item xs={12} md={10}>
              {props.group
                ? (
                  <>
                    <div style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
                      <MarkdownPreviewLight value={props.group.about} />
                    </div>

                    <TabContext value={tabIndex}>
                      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                        <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} aria-label="actions" centered>
                          <Tab label="Feed" sx={{ textTransform: "unset" }} value="0" />
                          <Tab label="Group Calendar" sx={{ textTransform: "unset" }} value="1" />
                          <Tab label="Conversations" sx={{ textTransform: "unset" }} value="2" />
                          <Tab label="Files" sx={{ textTransform: "unset" }} value="3" />
                        </Tabs>
                      </Box>
                      <TabPanel value="0">
                        <div style={{ maxWidth: 750, marginLeft: "auto", marginRight: "auto" }}>
                          <GroupTimeline context={context} groupId={props.group.id} />
                        </div>
                      </TabPanel>
                      <TabPanel value="1">
                        <DisplayBox headerText="Group Calendar">
                          <GroupCalendar groupId={props.group.id} churchId={props.config.church.id} canEdit={isLeader} />
                        </DisplayBox>
                      </TabPanel>
                      <TabPanel value="2">
                        <Conversations context={context} contentType="group" contentId={props.group.id} groupId={props.group.id} />
                      </TabPanel>
                      <TabPanel value="3">
                        <GroupFiles context={context} groupId={props.group.id} />
                      </TabPanel>
                    </TabContext>
                  </>
                )
                : (
                  <p>No group data found</p>
                )}


              <DisplayBox id="groupMembersBox" headerText="Group Members" headerIcon="group">
                {getTable()}
              </DisplayBox>
            </Grid>
          </Grid>
        </div>



      </Container>
    </>
  );
}
