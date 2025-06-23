"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Typography, Grid, Table, TableBody, TableRow, TableCell, Tooltip, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import { EnvironmentHelper, WrapperPageProps } from "@/helpers";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { DisplayBox, Loading, ApiHelper, CuratedCalendarInterface, GroupInterface, CuratedEventInterface, Banner } from "@churchapps/apphelper";
import { CuratedCalendar } from "@/components/admin/calendar/CuratedCalendar";

interface Props extends WrapperPageProps {
  curatedCalendarId: string;
}

export function CalendarClientWrapper(props: Props) {
  EnvironmentHelper.initLocale();
  const [currentCalendar, setCurrentCalendar] = useState<CuratedCalendarInterface>(null);
  const [groups, setGroups] = useState<GroupInterface[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);
  const [events, setEvents] = useState<CuratedEventInterface[]>([]);
  const [refresh, refresher] = useState({});


  const searchparams = useSearchParams()
  //const curatedCalendarId = searchparams.get("query.id")
  // const curatedCalendarId = router.query?.id;

  const loadData = () => {
    setIsLoadingGroups(true);
    ApiHelper.get("/curatedCalendars/" + props.curatedCalendarId, "ContentApi").then((data) => {
      setCurrentCalendar(data);
    });

    ApiHelper.get("/groups/my", "MembershipApi").then((data) => {
      setGroups(data);
      setIsLoadingGroups(false);
    });

    ApiHelper.get("/curatedEvents/calendar/" + props.curatedCalendarId + "?withoutEvents=1", "ContentApi").then((data: CuratedEventInterface[]) => {
      setEvents(data);
    });
  };

  const handleGroupDelete = (groupId: string) => {
    if (confirm("Are you sure you wish to delete this group?")) {
      ApiHelper.delete("/curatedEvents/calendar/" + props.curatedCalendarId + "/group/" + groupId, "ContentApi").then(() => {
        loadData();
        refresher({});
      });
    }
  };

  const addedGroups = groups.filter((g) => events.find((event) => event.groupId === g.id));

  const getRows = () => {
    let rows: JSX.Element[] = [];

    if (addedGroups.length === 0) {
      rows.push(
        <TableRow key="0">
          <TableCell>No Groups Found.</TableCell>
        </TableRow>
      );
    }

    addedGroups.map((g, index) => {
      rows.push(
        <TableRow key={index}>
          <TableCell>{g.name}</TableCell>
          <TableCell style={{textAlign:"right"}}>
            <Tooltip title="Remove Group" arrow>
              <IconButton color="primary" size="small" onClick={() => handleGroupDelete(g.id)} data-testid={`remove-group-${g.id}-button`} aria-label={`Remove ${g.name} from calendar`}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>
      );
    });

    return rows;
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AdminWrapper config={props.config}>
      <Banner data-testid="calendar-banner"><h1>{currentCalendar?.name}</h1></Banner>
      <div id="mainContent">
        <Grid container spacing={3}>
          <Grid item md={8} xs={12}>
            <DisplayBox headerText="" data-testid="curated-calendar-display-box">
              <Typography component="h2" variant="h6" color="primary">Curated Calendar</Typography>
              <CuratedCalendar curatedCalendarId={props.curatedCalendarId as string} churchId={props.config.church.id} mode="edit" updatedCallback={loadData} refresh={refresh} data-testid="curated-calendar" />
            </DisplayBox>
          </Grid>
          <Grid item md={4} xs={12}>
            <DisplayBox headerText="Groups" headerIcon="backup_table" data-testid="calendar-groups-display-box">
              {isLoadingGroups
                ? (
                  <Loading data-testid="groups-loading" />
                )
                : (
                  <Table size="small">
                    <TableBody>{getRows()}</TableBody>
                  </Table>
                )}
            </DisplayBox>
          </Grid>
        </Grid>
      </div>
    </AdminWrapper>
  );
}
