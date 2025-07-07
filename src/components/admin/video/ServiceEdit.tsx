"use client";
import { InputBox } from "@churchapps/apphelper/dist/components/InputBox";
import { Grid, InputLabel, MenuItem, Select, TextField, FormControl, SelectChangeEvent } from "@mui/material";
import React from "react";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { DateHelper } from "@churchapps/apphelper/dist/helpers/DateHelper";
import { UniqueIdHelper } from "@churchapps/apphelper/dist/helpers/UniqueIdHelper";
import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import type { SermonInterface, StreamingServiceInterface } from "@churchapps/helpers";

interface Props { currentService: StreamingServiceInterface, updatedFunction?: () => void }

export const ServiceEdit: React.FC<Props> = (props) => {
  const [currentService, setCurrentService] = React.useState<StreamingServiceInterface>(null);
  const [sermons, setSermons] = React.useState<SermonInterface[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const checkDelete = () => { if (!UniqueIdHelper.isMissing(currentService?.id)) return handleDelete; else return null; }
  const handleCancel = () => { props.updatedFunction(); }

  const loadData = () => {
    ApiHelper.get("/sermons", "ContentApi").then(data => {
      setSermons(data);
      setIsLoading(false);
    });
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you wish to delete this service?")) {
      ApiHelper.delete("/streamingServices/" + currentService.id, "ContentApi").then(() => { setCurrentService(null); props.updatedFunction(); });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const val = e.target.value;
    let s = { ...currentService };
    switch (e.target.name) {
      case "serviceLabel": s.label = val; break;
      case "serviceTime":
        const date = new Date(val);
        s.serviceTime = date;
        break;
      case "chatBefore": s.chatBefore = parseInt(val) * 60; break;
      case "chatAfter": s.chatAfter = parseInt(val) * 60; break;
      case "earlyStart": s.earlyStart = parseInt(val) * 60; break;
      case "provider": s.provider = val; break;
      case "providerKey":
        s.providerKey = val;
        if (s.provider === "youtube_live" || s.provider === "youtube_watchparty") s.providerKey = getYouTubeKey(s.providerKey);
        else if (s.provider === "facebook_live") s.providerKey = getFacebookKey(s.providerKey);
        else if (s.provider === "vimeo_live" || s.provider === "vimeo_watchparty") s.providerKey = getVimeoKey(s.providerKey);
        break;
      case "recurs": s.recurring = val === "true"; break;
      case "sermonId": s.sermonId = val; break;
    }
    setCurrentService(s);
  }

  //auto fix common bad formats.
  const getVimeoKey = (facebookInput: string) => {
    let result = facebookInput.split("&")[0];
    result = result
      .replace("https://vimeo.com/", "")
      .replace("https://player.vimeo.com/video/", "")
    return result;
  }

  //auto fix common bad formats.
  const getFacebookKey = (facebookInput: string) => {
    let result = facebookInput.split("&")[0];
    result = result
      .replace("https://facebook.com/video.php?v=", "")
    return result;
  }

  //auto fix common bad formats.
  const getYouTubeKey = (youtubeInput: string) => {
    let result = youtubeInput.split("&")[0];
    result = result
      .replace("https://www.youtube.com/watch?v=", "")
      .replace("https://youtube.com/watch?v=", "")
      .replace("https://youtu.be/", "")
      .replace("https://www.youtube.com/embed/", "")
      .replace("https://studio.youtube.com/video/", "")
      .replace("/edit", "");
    return result;
  }

  const handleSave = () => {
    setVideoUrl();
    ApiHelper.post("/streamingServices", [currentService], "ContentApi").then(props.updatedFunction);
  }

  const setVideoUrl = () => {
    let result = currentService?.providerKey;
    switch (currentService?.provider) {
      case "youtube_live":
      case "youtube_watchparty":
        result = "https://www.youtube.com/embed/" + currentService?.providerKey + "?autoplay=1&controls=0&showinfo=0&rel=0&modestbranding=1&disablekb=1";
        break;
      case "vimeo_live":
      case "vimeo_watchparty":
        result = "https://player.vimeo.com/video/" + currentService?.providerKey + "?autoplay=1";
        break;
      case "facebook_live":
        result = "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D" + currentService?.providerKey + "&show_text=0&autoplay=1&allowFullScreen=1";
        break;
    }
    return currentService.videoUrl = result;
  }

  const getSermons = () => {
    let result: React.ReactElement[] = [];
    sermons.forEach(sermon => {
      if (sermon.permanentUrl) result.push(<MenuItem value={sermon.id}>{sermon.title}</MenuItem>);
    });
    result.push(<hr />)
    sermons.forEach(sermon => {
      if (!sermon.permanentUrl) result.push(<MenuItem value={sermon.id}>{sermon.title}</MenuItem>);
    });
    return result;
  }

  React.useEffect(() => { setCurrentService(props.currentService); loadData(); }, [props.currentService]);

  if (isLoading) return <Loading />
  else {

    let localServiceTime = currentService?.serviceTime;
    let chatAndPrayerStartTime = currentService?.serviceTime?.getTime() - currentService?.chatBefore * 1000;
    let chatAndPrayerEndTime = currentService?.serviceTime?.getTime() + currentService?.chatAfter * 1000;
    let earlyStartTime = currentService?.serviceTime?.getTime() - currentService?.earlyStart * 1000;
    return (
      <InputBox headerIcon="calendar_month" headerText="Edit Service" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={checkDelete()} data-testid="edit-service-inputbox">
        <>
          <TextField fullWidth label="Service Name" name="serviceLabel" value={currentService?.label || ""} onChange={handleChange} data-testid="service-name-input" />
          <Grid container spacing={3}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Service Time" type="datetime-local" name="serviceTime" InputLabelProps={{ shrink: !!DateHelper.formatHtml5DateTime(localServiceTime) }} defaultValue={DateHelper.formatHtml5DateTime(localServiceTime)} onChange={handleChange} data-testid="service-time-input" />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Recurs Weekly</InputLabel>
                <Select label="Recurs Weekly" name="recurs" value={Boolean(currentService?.recurring).toString() || ""} onChange={handleChange}>
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Enable Chat - Minutes Before" type="number" name="chatBefore" value={currentService?.chatBefore / 60 || ""} onChange={handleChange} InputProps={{
                inputProps: { min: 0, step: 1 },
                endAdornment: <span style={{ whiteSpace: "nowrap" }}>{DateHelper.prettyTime(new Date(chatAndPrayerStartTime))}</span>
              }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Enable Chat - Minutes After" type="number" name="chatAfter" value={currentService?.chatAfter / 60 || ""} onChange={handleChange} InputProps={{
                inputProps: { min: 0, step: 1 },
                endAdornment: <span style={{ whiteSpace: "nowrap" }}>{DateHelper.prettyTime(new Date(chatAndPrayerEndTime))}</span>
              }} />
            </Grid>
          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Start Video Early - Optional for countdowns" type="number" name="earlyStart" value={currentService?.earlyStart / 60 || ""} onChange={handleChange} InputProps={{
                inputProps: { min: 0, step: 1 },
                endAdornment: <span style={{ whiteSpace: "nowrap" }}>{DateHelper.prettyTime(new Date(earlyStartTime))}</span>
              }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Sermon</InputLabel>
                <Select label="Sermon" name="sermonId" value={currentService.sermonId} onChange={handleChange}>
                  <MenuItem value="latest">Latest Sermon</MenuItem>
                  {getSermons()}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </>
      </InputBox>
    );
  }
}
