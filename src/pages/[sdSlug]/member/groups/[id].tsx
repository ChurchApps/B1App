import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { GroupInterface, ApiHelper, UserHelper, ConfigHelper, WrapperPageProps } from "@/helpers";
import { Wrapper, MarkdownPreview, Conversations, Loading, DisplayBox } from "@/components";
import UserContext from "@/context/UserContext";
import { GetStaticPaths, GetStaticProps } from "next";
import { Grid, Table, TableBody, TableCell, TableRow } from "@mui/material";
import { PersonHelper } from "@/appBase/helpers";
import { Person } from "@/components/member/directory/Person";

export default function GroupPage(props: WrapperPageProps) {
  const [group, setGroup] = useState<GroupInterface>(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personId, setPersonId] = useState<string>('');

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
          Please <Link href="/login/?returnUrl=/directory">Login</Link> to view
          your groups.
        </h3>
      </Wrapper>
    );
  }

  const handleBack = () => { setPersonId(""); }

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
              style={{ width: "80px", height: "64px", borderRadius: 8 }}
            />
          </TableCell>
          <TableCell>
            <Link href="about:blank" onClick={(e) => { e.preventDefault(); setPersonId(gm.person.id) }}>
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
        <Table id="groupMemberTable">
          <TableBody>{getRows()}</TableBody>
        </Table>
      );
  };

  return (
    <Wrapper config={props.config}>
      { personId ? <Person personId={personId} backHandler={handleBack} selectedHandler={null} /> : <Grid container spacing={3} alignItems="flex-start">
        <Grid item md={8} xs={12}>
          {group ? (
            <>
              <h1>{group.name}</h1>
              {group.photoUrl && ( 
                <img id="tabImage" src={group.photoUrl} alt={group.name} style={{ maxHeight: 300 }} />
              )}
              <div style={{ paddingTop: "1rem", paddingBottom: "3rem" }}>
                <MarkdownPreview value={group.about} />
              </div>
              <Conversations context={context} contentType="group" contentId={group.id} groupId={group.id} />
            </>
          ) : (
            <p>No group data found</p>
          )}
        </Grid>
        <Grid item container md={4} xs={12} sx={{mt: 11}}>
          <Grid md={1} xs={12}><div></div></Grid>
          <Grid md={11} xs={12}>
            <DisplayBox id="groupMembersBox" data-cy="group-members-tab" headerText="Group Members" headerIcon="group" editContent={false} >
              {getTable()}
            </DisplayBox>
          </Grid>
        </Grid>
      </Grid>}
    </Wrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
