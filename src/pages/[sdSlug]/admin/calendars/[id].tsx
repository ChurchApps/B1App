import { useEffect, useState } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
import { Typography, Grid, Table, TableBody, TableRow, TableCell, Tooltip, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfigHelper, ApiHelper, WrapperPageProps, CuratedCalendarInterface, GroupInterface, CuratedEventWithEventInterface } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { DisplayBox, Loading } from "@/components";
import { CuratedCalendar } from "@/components/admin/calendar/CuratedCalendar";

export default function CalendarPage(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;

  const [currentCalendar, setCurrentCalendar] = useState<CuratedCalendarInterface>(null);
  const [groups, setGroups] = useState<GroupInterface[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);
  const [events, setEvents] = useState<CuratedEventWithEventInterface[]>([]);
  const [refresh, refresher] = useState({});

  const router = useRouter();
  const curatedCalendarId = router.query?.id;

  const loadData = () => {
    if (!isAuthenticated) router.push("/login");
    ApiHelper.get("/curatedCalendars/" + curatedCalendarId, "ContentApi").then((data) => setCurrentCalendar(data));

    setIsLoadingGroups(true);
    ApiHelper.get("/groups/my", "MembershipApi").then((data) => { setGroups(data); setIsLoadingGroups(false); });

    ApiHelper.get("/curatedEvents/calendar/" + curatedCalendarId, "ContentApi").then((data: CuratedEventWithEventInterface[]) => {
      setEvents(data);
    });
  };

  const handleGroupDelete = (groupId: string) => {
    if(confirm("Are you sure you wish to delete this group?")) {
      ApiHelper.delete("/curatedEvents/calendar/" + curatedCalendarId + "/group/" + groupId, "ContentApi").then(() => { loadData(); refresher({}); })
    }
  }

  const addedGroups = groups.filter((g) => {
    return events.find((event) => {
      return event.groupId === g.id
    });
  });

  const getRows = () => {
    let rows: JSX.Element[] = [];

    if (addedGroups.length === 0) {
      rows.push(
        <TableRow key="0">
          <TableCell>No Groups Found.</TableCell>
        </TableRow>
      )
    }

    addedGroups.map((g, index) => {
      rows.push(
        <TableRow key={index}>
          <TableCell>{g.name}</TableCell>
          <TableCell>
            <Tooltip title="Remove Group" arrow>
              <IconButton color="primary" size="small" onClick={() => { handleGroupDelete(g.id) }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
      )
    })

    return rows;
  }

  useEffect(() => { loadData(); }, []);
  
  return (
    <AdminWrapper config={props.config}>
      <h1>{currentCalendar?.name}</h1>
      <Grid container spacing={3}>
        <Grid item md={9} xs={12}>
          <DisplayBox headerText="">
            <Typography component="h2" variant="h6" color="primary">Curated Calendar</Typography>
            <CuratedCalendar curatedCalendarId={curatedCalendarId as string} churchId={props.config.church.id} updatedCallback={loadData} refresh={refresh} />
          </DisplayBox>
        </Grid>
        <Grid item md={3} xs={12}>
          <DisplayBox headerText="Groups" headerIcon="backup_table">
            {isLoadingGroups ? (
              <Loading />
            ) : (
              <Table size="small">
                <TableBody>{getRows()}</TableBody>
              </Table>
            )}
          </DisplayBox>
        </Grid>
      </Grid>
    </AdminWrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths: any[] = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
