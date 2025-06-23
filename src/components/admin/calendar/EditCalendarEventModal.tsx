import { useState, useEffect } from "react";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, FormControl, FormControlLabel, InputLabel, Select, SelectChangeEvent, MenuItem, RadioGroup, Radio, Stack, Button, Alert } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { } from "@/helpers";
import { Loading } from "@churchapps/apphelper";
import { EventHelper, GroupInterface, EventInterface, ApiHelper } from "@churchapps/apphelper";

interface Props {
  churchId: string;
  curatedCalendarId: string;
  onDone?: () => void;
}

export function EditCalendarEventModal(props: Props) {
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(false);
  const [groups, setGroups] = useState<GroupInterface[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [addType, setAddType] = useState<string>("group");
  const [groupEvents, setGroupEvents] = useState<EventInterface[]>([]);
  const [eventIdsList, setEventIdsList] = useState<string[]>([]);

  const localizer = momentLocalizer(moment);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down(396));

  const loadData = () => {
    setIsLoadingGroups(true);
    ApiHelper.get("/groups/my", "MembershipApi").then((data) => { setGroups(data); setIsLoadingGroups(false); });
  };

  const getGroupEvents = () => {
    selectedGroupId && ApiHelper.get("/events/public/group/" + props.churchId + "/" + selectedGroupId, "ContentApi").then((data) => setGroupEvents(data));
  };

  const handleDone = () => {
    setSelectedGroupId("");
    setAddType("group");
    setGroupEvents([]);
    setEventIdsList([]);
    props.onDone();
  };

  const handleSave = () => {
    let data: any = { curatedCalendarId: props.curatedCalendarId, groupId: selectedGroupId as string };
    if (addType === "events" && eventIdsList.length > 0) data.eventIds = eventIdsList;

    ApiHelper.post("/curatedEvents", [data], "ContentApi").then(() => {
      handleDone();
    });
  };

  const handleEventsListChange = (slotInfo: EventInterface) => {
    const selectedEvent = slotInfo.id;
    const selectedIndex = eventIdsList.indexOf(selectedEvent);
    const list = [...eventIdsList];

    if (selectedIndex === -1) {
      list.push(selectedEvent);
    } else {
      list.splice(selectedIndex, 1);
    }

    setEventIdsList(list);
  };

  const selectedEventStyle = (event: EventInterface) => {
    const id = eventIdsList.find((id) => id === event.id);
    const backgroundColor = id ? "green" : "#3174ad";
    const borderColor = id ? "white" : "#3174ad";
    return {
      style: {
        backgroundColor: backgroundColor,
        borderColor: borderColor,
      },
    };
  };

  const expandedGroupEvents: EventInterface[] = [];
  const startRange = new Date();
  const endRange = new Date();
  startRange.setFullYear(startRange.getFullYear() - 1);
  endRange.setFullYear(endRange.getFullYear() + 1);

  groupEvents.forEach((event) => {
    const ev = { ...event };
    ev.start = new Date(ev.start);
    ev.end = new Date(ev.end);
    if (ev.recurrenceRule) {
      const dates = EventHelper.getRange(ev, startRange, endRange);
      dates.forEach((date) => {
        const evt = { ...event };
        const diff
          = new Date(evt.end).getTime() - new Date(evt.start).getTime();
        evt.start = date;
        evt.end = new Date(date.getTime() + diff);
        expandedGroupEvents.push(evt);
      });
    } else expandedGroupEvents.push(ev);
  });

  useEffect(() => { getGroupEvents(); }, [selectedGroupId]);
  useEffect(() => { loadData(); }, []);

  return (
    <Dialog open={true} onClose={handleDone} fullWidth scroll="body" fullScreen={fullScreen}>
      <DialogTitle>Add a Group</DialogTitle>
      <DialogContent>
        {isLoadingGroups
          ? (
            <Loading />
          )
          : (
            <>
              {groups?.length > 0
                ? (
                  <FormControl fullWidth>
                    <InputLabel>Select a Group</InputLabel>
                    <Select fullWidth label="Select a Group" value={selectedGroupId} onChange={(e: SelectChangeEvent) => setSelectedGroupId(e.target.value as string)} data-testid="calendar-group-select">
                      {groups.map((group) => <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                )
                : (
                  <Typography>No groups found.</Typography>
                )}
            </>
          )}
        {selectedGroupId && (
          <FormControl fullWidth>
            <RadioGroup value={addType} onChange={(e) => { setAddType(e.target.value); }}>
              <Stack direction={{ xs: "column", sm: "row" }}>
                <FormControlLabel control={<Radio size="small" />} value="group" label="Add all the events of the group" />
                <FormControlLabel control={<Radio size="small" />} value="events" label="Add specific events" />
              </Stack>
            </RadioGroup>
          </FormControl>
        )}
        {addType === "events" && groupEvents.length > 0 && (
          <div style={{ marginTop: 11 }}>
            <Typography align="center" fontSize="15px" fontStyle="italic" marginBottom={3} color="#757575">*Click on an event to add it to the Curated Calendar.*</Typography>
            <Calendar localizer={localizer} views={["month", "week", "day"]} events={expandedGroupEvents} startAccessor="start" endAccessor="end" style={{ height: 500 }} onSelectEvent={handleEventsListChange} eventPropGetter={selectedEventStyle} />
          </div>
        )}
        {addType === "events" && groupEvents.length <= 0 && (
          <div style={{ marginTop: 11 }}>
            <Alert sx={{ align: "center", fontSize: "15px", fontStyle: "italic", marginBottom: "3" }} severity="error">*No events found. Please add events to the individual group before adding to the Curated Calendar.*</Alert>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={handleDone} data-testid="calendar-edit-cancel-button">cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!selectedGroupId || (addType === "events" && eventIdsList.length === 0)} data-testid="calendar-edit-save-button">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
