import { useEffect, useState } from "react";
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { ApiHelper, GroupInterface, CuratedCalendarInterface, Loading } from "@churchapps/apphelper";

interface Props {
  parsedData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>) => void;
}

export const CalendarElementEdit = ({ parsedData, handleChange }: Props) => {
  const [calendars, setCalendars] = useState<GroupInterface[] | CuratedCalendarInterface[]>(null);

  const loadCalendars = () => {
    const apiCalls = () => {
      if (parsedData.calendarType === "group") ApiHelper.get("/groups/my", "MembershipApi").then((data) => setCalendars(data));
      else ApiHelper.get("/curatedCalendars", "ContentApi").then((data) => setCalendars(data));
    };

    parsedData.calendarType && apiCalls();
  };

  useEffect(() => { loadCalendars(); }, [parsedData?.calendarType]);

  return (
    <>
      <FormControl fullWidth>
        <InputLabel>Select</InputLabel>
        <Select fullWidth size="small" label="Select" name="calendarType" onChange={handleChange} value={parsedData.calendarType || ""}>
          <MenuItem value="group">Group Calendar</MenuItem>
          <MenuItem value="curated">Curated Calendar</MenuItem>
        </Select>
      </FormControl>
      <div style={{ marginTop: 15 }}>
        {parsedData.calendarType && (
          <>
            {calendars?.length > 0
              ? (
                <>
                  <FormControl fullWidth>
                    <InputLabel>Select Calendar</InputLabel>
                    <Select fullWidth size="small" label="Select Calendar" name="calendarId" onChange={handleChange} value={parsedData.calendarId || ""}>
                      {calendars.map((calendar) => <MenuItem value={calendar.id}>{calendar.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </>
              )
              : (
                <Loading />
              )}
          </>
        )}
      </div>
    </>
  );
};
