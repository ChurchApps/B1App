import { useEffect, useState } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Grid, Table, TableBody, TableRow, TableCell, Tooltip, IconButton } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { ConfigHelper, ApiHelper, WrapperPageProps, CuratedCalendarInterface, CuratedEventInterface, GroupInterface, EventInterface } from "@/helpers";
import { EventHelper } from "@/appBase/helpers/EventHelper";
import { AdminWrapper } from "@/components/admin/AdminWrapper";
import { DisplayBox, Loading } from "@/components";
import { DisplayCalendarEventModal } from "@/components/admin/calendar/DisplayCalendarEventModal";

export default function CalendarPage(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;

  const [currentCalendar, setCurrentCalendar] = useState<CuratedCalendarInterface>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [groups, setGroups] = useState<GroupInterface[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [curatedEvents, setCuratedEvents] = useState<CuratedEventInterface[]>([]);
  const [events, setEvents] = useState<EventInterface[]>([]);
  const [displayCalendarEvent, setDisplayCalendarEvent] = useState<EventInterface | null>(null);

  const router = useRouter();
  const curatedCalendarId = router.query?.id;
  const localizer = momentLocalizer(moment);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down(396));

  const loadData = () => {
    if (!isAuthenticated) router.push("/login");
    ApiHelper.get("/curatedCalendars/" + curatedCalendarId, "ContentApi").then((data) => setCurrentCalendar(data));

    setIsLoadingGroups(true);
    ApiHelper.get("/groups/my", "MembershipApi").then((data) => { setGroups(data); setIsLoadingGroups(false); });

    ApiHelper.get("/curatedEvents/calendar/" + curatedCalendarId + "?with=eventData", "ContentApi").then((data: CuratedEventInterface[]) => {
      setCuratedEvents(data);
      const newEvents: EventInterface[] = data?.map(d => d.eventData) ?? [];
      setEvents(newEvents);
    });
  };

  const handleEventClick = (event: EventInterface) => {
    const ev = {...event};
    let tz = new Date().getTimezoneOffset();
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    ev.start.setMinutes(ev.start.getMinutes() - tz);
    ev.end.setMinutes(ev.end.getMinutes() - tz);
    setDisplayCalendarEvent(ev);
  }
  
  const handleSave = () => {
    const data = { curatedCalendarId: curatedCalendarId, groupId: selectedGroupId as string };
    ApiHelper.post("/curatedEvents", [data], "ContentApi").then(() => {
      setSelectedGroupId("");
      setOpen(false);
      loadData();
    });
  };

  const handleGroupDelete = (groupId: string) => {
    if(confirm("Are you sure you wish to delete this group?")) {
      ApiHelper.delete("/curatedEvents/calendar/" + curatedCalendarId + "/group/" + groupId, "ContentApi").then(() => { loadData(); })
    }
  }

  const handleGroupSync = (groupId: string) => {
    ApiHelper.delete("/curatedEvents/calendar/" + curatedCalendarId + "/group/" + groupId, "ContentApi").then(() => {
      ApiHelper.post("/curatedEvents", [{ curatedCalendarId: curatedCalendarId, groupId: groupId as string }], "ContentApi").then(() => {
        loadData();
      })
    })
  }

  const addedGroups = groups.filter((g) => {
    return curatedEvents.find((crtEv) => {
      return crtEv.groupId === g.id
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
            <Tooltip title="Sync: All new group events will be added to the calendar" arrow>
              <IconButton color="primary" size="small" onClick={() => { handleGroupSync(g.id) }}>
                <SyncIcon />
              </IconButton>
            </Tooltip>
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
  
  const expandedEvents:EventInterface[] = [];
  const startRange = new Date();
  const endRange = new Date();
  startRange.setFullYear(startRange.getFullYear() - 1);
  endRange.setFullYear(endRange.getFullYear() + 1);

  events.forEach((event) => {
    const ev = {...event};
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    if (ev.recurrenceRule) {
      const dates = EventHelper.getRange(ev, startRange, endRange);
      dates.forEach((date) => {
        const evt = { ...event };
        const diff = new Date(evt.end).getTime() - new Date(evt.start).getTime();
        evt.start = date;
        evt.end = new Date(date.getTime() + diff);
        expandedEvents.push(evt);
      });
    }
    else expandedEvents.push(ev);
  });

  useEffect(() => { loadData(); }, []);
  
  return (
    <AdminWrapper config={props.config}>
      <h1>{currentCalendar?.name}</h1>
      <Grid container spacing={3}>
        <Grid item md={9} xs={12}>
          <DisplayBox headerText="">
            <Box
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <Typography component="h2" variant="h6" color="primary">Curated Calendar</Typography>
              <Button endIcon={<EventNoteIcon />} size="small" variant="contained" onClick={() => { setOpen(true); }}>Add</Button>
            </Box>
            <Calendar localizer={localizer} events={expandedEvents} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventClick} />
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
      {displayCalendarEvent && <DisplayCalendarEventModal event={displayCalendarEvent} handleDone={() => { setDisplayCalendarEvent(null); loadData(); }} />}
      <Dialog open={open} onClose={() => { setOpen(false); setSelectedGroupId(""); }} fullWidth scroll="body" fullScreen={fullScreen}>
        <DialogTitle>Add a Group</DialogTitle>
        <DialogContent>
          {isLoadingGroups ? (
            <Loading />
          ) : (
            <>
              {groups?.length > 0 ? (
                <FormControl fullWidth>
                  <InputLabel>Select a Group</InputLabel>
                  <Select fullWidth label="Select a Group" value={selectedGroupId} onChange={(e: SelectChangeEvent) => setSelectedGroupId(e.target.value as string)}>
                    {groups.map((group) => <MenuItem disabled={curatedEvents.some((curatedEvent) => curatedEvent.groupId.includes(group.id))} key={group.id} value={group.id}>{group.name}</MenuItem>)}
                  </Select>
                </FormControl>
              ) : (
                <Typography>No groups found.</Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => { setOpen(false); setSelectedGroupId(""); }}>cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!selectedGroupId}>Save</Button>
        </DialogActions>
      </Dialog>
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
