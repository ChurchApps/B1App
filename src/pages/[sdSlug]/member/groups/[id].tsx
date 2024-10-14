import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { Wrapper } from "@/components";
import { MarkdownPreviewLight, Conversations, Loading, DisplayBox, GroupInterface, ApiHelper, UserHelper, PersonHelper } from "@churchapps/apphelper"
import UserContext from "@/context/UserContext";
import { GetStaticPaths, GetStaticProps } from "next";
import { Box, Grid, Tab, Table, TableBody, TableCell, TableRow, Tabs } from "@mui/material";
import { GroupCalendar } from "@/components/eventCalendar/GroupCalendar";
import { TabContext, TabPanel } from "@mui/lab";
import { GroupTimeline } from "@/components/member/timeline/GroupTimeline";
import { GroupFiles } from "@/components/groups/GroupFiles";

export default function GroupPage(props: WrapperPageProps) {
  const [group, setGroup] = useState<GroupInterface>(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState("0");

  const router = useRouter();
  const context = useContext(UserContext);
  const { id: groupId } = router.query;

  const loadData = () => {
    setIsLoading(true);
    ApiHelper.get("/groups/" + groupId, "MembershipApi").then((data) =>
      setGroup(data)
    );

    let gm = { groupId: groupId };
    ApiHelper.get(`/groupmembers?groupId=${groupId}`, "MembershipApi")
      .then((data) => setGroupMembers(data))
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(loadData, [groupId]);

  if (!UserHelper.currentUserChurch?.person?.id) {
    return (
      <Wrapper config={props.config}>
        <h1>Group</h1>
        <h3 className="text-center w-100">
          Please <Link href={"/login/?returnUrl=/member/groups/" + groupId}>Login</Link> to view
          your groups.
        </h3>
      </Wrapper>
    );
  }

  const getRows = () => {
    let rows: JSX.Element[] = [];

    if (groupMembers.length === 0) {
      rows.push(
        <TableRow key="0">
          <TableCell>No group members found.</TableCell>
        </TableRow>
      );
      return rows;
    }

    for (let i = 0; i < groupMembers.length; i++) {
      const gm = groupMembers[i];
      rows.push(
        <TableRow key={i}>
          <TableCell>
            <img
              src={PersonHelper.getPhotoUrl(gm.person)}
              alt="avatar"
              style={{ width: "50px", height: "40px", borderRadius: 8 }}
            />
          </TableCell>
          <TableCell>
            <Link href={"/member/directory/" + gm.person.id}>
              {gm.person.name.display}
            </Link>
          </TableCell>
        </TableRow>
      );
    }
    return rows;
  };

  const getTable = () => {
    if (isLoading) return <Loading />;
    else
      return (
        <Table id="groupMemberTable" size="small">
          <TableBody>{getRows()}</TableBody>
        </Table>
      );
  };

  let isLeader = false;
  UserHelper.currentUserChurch.groups?.forEach((g) => {
    if (g.id === groupId && g.leader) isLeader = true;
  });

  console.log("IS LEADER", isLeader)


  return (
    <Wrapper config={props.config}>
      <Grid container spacing={3} alignItems="flex-start">
        <Grid item md={8} xs={12}>
          {group
            ? (
              <>
                <h1>{group.name}</h1>
                {group.photoUrl && (
                  <img id="tabImage" src={group.photoUrl} alt={group.name} style={{ maxHeight: 300 }} />
                )}
                <div style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
                  <MarkdownPreviewLight value={group.about} />
                </div>

                <TabContext value={tabIndex}>
                  <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs value={tabIndex} onChange={(e, newValue) => { setTabIndex(newValue); }} aria-label="actions" centered>
                      <Tab label="Feed" sx={{ textTransform: "unset" }} value="0" />
                      <Tab label="Group Calendar" sx={{ textTransform: "unset" }} value="1" />
                      <Tab label="Conversations" sx={{ textTransform: "unset" }} value="2" />
                      <Tab label="Files" sx={{ textTransform: "unset" }} value="3" />
                    </Tabs>
                  </Box>
                  <TabPanel value="0">
                    <div style={{maxWidth: 750, marginLeft:"auto", marginRight:"auto"}}>
                      <GroupTimeline context={context} groupId={group.id} />
                    </div>
                  </TabPanel>
                  <TabPanel value="1">
                    <DisplayBox headerText="Group Calendar">
                      <GroupCalendar groupId={group.id} churchId={props.config.church.id} canEdit={isLeader} />
                    </DisplayBox>
                  </TabPanel>
                  <TabPanel value="2">
                    <Conversations context={context} contentType="group" contentId={group.id} groupId={group.id} />
                  </TabPanel>
                  <TabPanel value="3">
                    <GroupFiles context={context} groupId={group.id} />
                  </TabPanel>
                </TabContext>
              </>
            )
            : (
              <p>No group data found</p>
            )}
        </Grid>
        <Grid item md={4} xs={12} sx={{mt: 11}}>
          <DisplayBox id="groupMembersBox" data-cy="group-members-tab" headerText="Group Members" headerIcon="group" editContent={false}>
            {getTable()}
          </DisplayBox>
        </Grid>
      </Grid>
    </Wrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
