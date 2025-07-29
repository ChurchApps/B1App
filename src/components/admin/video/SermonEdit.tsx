"use client";
import React from "react";
import { Grid, InputLabel, MenuItem, Select, TextField, FormControl, SelectChangeEvent, Button, Icon } from "@mui/material";
import { Loading } from "@churchapps/apphelper";
import { InputBox } from "@churchapps/apphelper";
import { ErrorMessages } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { UniqueIdHelper } from "@churchapps/apphelper";
import { DateHelper } from "@churchapps/apphelper";
import { UserHelper } from "@churchapps/apphelper";
import { Permissions } from "@churchapps/helpers";
import type { SermonInterface, PlaylistInterface } from "@churchapps/helpers";
import { Duration } from "./Duration";
import { B1ShareModal } from "@/components/B1ShareModal";

interface Props {
  currentSermon: SermonInterface,
  updatedFunction?: () => void,
  showPhotoEditor: (photoType: string, url: string) => void,
  updatedPhoto: string
}

export const SermonEdit: React.FC<Props> = (props) => {

  const [errors, setErrors] = React.useState<string[]>([]);
  const [currentSermon, setCurrentSermon] = React.useState<SermonInterface>(null);
  const [playlists, setPlaylists] = React.useState<PlaylistInterface[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showB1Share, setShowB1Share] = React.useState(false);
  const [showOption, setShowOption] = React.useState(false);
  const [additionalPlaylistId, setAdditionalPlaylistId] = React.useState("");

  const loadData = () => {
    ApiHelper.get("/playlists", "ContentApi").then((data: any) => {
      setPlaylists(data);
      setIsLoading(false);
    });
  }

  const checkDelete = () => { if (!UniqueIdHelper.isMissing(currentSermon?.id)) return handleDelete; else return null; }
  const handleCancel = () => { props.updatedFunction(); }

  const handlePhotoUpdated = () => {
    if (props.updatedPhoto !== null && props.updatedPhoto !== currentSermon?.thumbnail) {
      const s = { ...currentSermon };
      s.thumbnail = props.updatedPhoto;
      props.showPhotoEditor("", null);
      setCurrentSermon(s);
    }
  }

  const handleDelete = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit)) errors.push("Unauthorized to delete sermons");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    if (window.confirm("Are you sure you wish to delete this sermon?")) {
      ApiHelper.delete("/sermons/" + currentSermon.id, "ContentApi").then(() => { setCurrentSermon(null); props.updatedFunction(); });
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const val = e.target.value;
    let v = { ...currentSermon };
    switch (e.target.name) {
      case "title": v.title = val; break;
      case "description": v.description = val; break;
      case "publishDate": v.publishDate = DateHelper.toDate(val); break;
      case "videoType": v.videoType = val; break;
      case "playlistId": v.playlistId = val; break;
      case "videoData":
        v.videoData = val;
        if (v.videoType === "youtube") v.videoData = getYouTubeKey(v.videoData);
        else if (v.videoType === "facebook") v.videoData = getFacebookKey(v.videoData);
        else if (v.videoType === "vimeo") v.videoData = getVimeoKey(v.videoData);
        break;
    }
    setCurrentSermon(v);
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
    let errors: string[] = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit)) errors.push("Unauthorized to create sermons");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    setSermonUrl();
    ApiHelper.post("/sermons", [currentSermon], "ContentApi").then(props.updatedFunction);
  }

  const handleAdd = () => {
    let errors: string[] = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit)) errors.push("Unauthorized to create sermons");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    const sermon = { ...currentSermon };
    sermon.playlistId = additionalPlaylistId;
    sermon.id = null;

    ApiHelper.post("/sermons", [sermon], "ContentApi").then(() => {
      setShowOption(false);
      props.updatedFunction()
    });
  }

  const setSermonUrl = () => {
    let result = currentSermon?.videoData;
    switch (currentSermon?.videoType) {
      case "youtube_channel":
        result = "https://www.youtube.com/embed/live_stream?channel=" + currentSermon?.videoData;
        break;
      case "youtube":
        result = "https://www.youtube.com/embed/" + currentSermon?.videoData + "?autoplay=1&controls=0&showinfo=0&rel=0&modestbranding=1&disablekb=1";
        break;
      case "vimeo":
        result = "https://player.vimeo.com/video/" + currentSermon?.videoData + "?autoplay=1";
        break;
      case "facebook":
        result = "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo.php%3Fv%3D" + currentSermon?.videoData + "&show_text=0&autoplay=1&allowFullScreen=1";
        break;
    }
    return currentSermon.videoUrl = result;
  }

  const fetchVideo = (videoType: "youtube" | "vimeo") => {
    ApiHelper.getAnonymous(`/sermons/lookup?videoType=${videoType}&videoData=${currentSermon.videoData}`, "ContentApi").then((d: any) => {
      let v = { ...currentSermon };
      v.title = d.title;
      v.description = d.description;
      v.thumbnail = d.thumbnail;
      v.duration = d.duration;
      v.publishDate = d.publishDate;
      setCurrentSermon(v);
    })
  }

  const getPlaylists = () => {
    let result: React.ReactElement[] = [];
    playlists.forEach((playlist: any) => {
      result.push(<MenuItem key={playlist.id} value={playlist.id} data-testid={`playlist-option-${playlist.id}`} aria-label={playlist.title}>{playlist.title}</MenuItem>);
    });
    return result;
  }

  const getAdditionalPlaylists = () => {
    let result: React.ReactElement[] = [];
    playlists.forEach((playlist: any) => {
      if (playlist.id !== currentSermon.playlistId) result.push(<MenuItem key={playlist.id} value={playlist.id} data-testid={`additional-playlist-option-${playlist.id}`} aria-label={playlist.title}>{playlist.title}</MenuItem>);
    });
    return result;
  }

  const getShareIcon = () => (<a href="about:blank" onClick={(e) => { e.preventDefault(); setShowB1Share(true); }} data-testid="share-sermon-button" aria-label="Share sermon"><Icon style={{fontSize:18, paddingTop:7, height:30, paddingRight:20}}>share</Icon></a>)

  React.useEffect(() => { setCurrentSermon(props.currentSermon); loadData(); }, [props.currentSermon]);
  React.useEffect(handlePhotoUpdated, [props.updatedPhoto, currentSermon]); //eslint-disable-line

  let keyLabel = <>Sermon Embed Url</>;
  let keyPlaceholder = "https://yourprovider.com/yoururl/"
  let endAdornment = <></>

  switch (currentSermon?.videoType) {
    case "youtube_channel":
      keyLabel = <>YouTube Channel ID <span className="description" style={{ float: "right", marginTop: 3, paddingLeft: 5 }}><a target="blank" rel="noreferrer noopener" href="https://support.churchapps.org/b1/streaming/youtube-channel-id.html">Get Your Channel Id</a></span></>;
      keyPlaceholder = "UCfiDl90gAfZMkgbeCqX1Wi0 - This is not your channel url";
      break;
    case "youtube":
      keyLabel = <>YouTube ID <span className="description" style={{ float: "right", marginTop: 3, paddingLeft: 5 }}>https://youtube.com/watch?v=<b style={{ color: "#24b8ff" }}>abcd1234</b></span></>;
      keyPlaceholder = "abcd1234";
      endAdornment = <Button variant="contained" onClick={() => fetchVideo("youtube")} data-testid="fetch-youtube-button" aria-label="Fetch YouTube video details">Fetch</Button>
      break;
    case "vimeo":
      keyLabel = <>Vimeo ID <span className="description" style={{ float: "right", marginTop: 3, paddingLeft: 5 }}>https://vimeo.com/<b style={{ color: "#24b8ff" }}>123456789</b></span></>;
      keyPlaceholder = "123456789";
      endAdornment = <Button variant="contained" onClick={() => fetchVideo("vimeo")} data-testid="fetch-vimeo-button" aria-label="Fetch Vimeo video details">Fetch</Button>
      break;
    case "facebook":
      keyLabel = <>Sermon ID <span className="description" style={{ float: "right", marginTop: 3, paddingLeft: 5 }}>https://facebook.com/video.php?v=<b>123456789</b></span></>;
      keyPlaceholder = "123456789";
      break;
  }

  if (isLoading) return <Loading data-testid="sermon-edit-loading" />
  else return (<><InputBox headerIcon="calendar_month" headerText={(currentSermon?.permanentUrl) ? "Edit Permanent Live Url" : "Edit Sermon"} saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={checkDelete()} help="b1/streaming/sermons" headerActionContent={getShareIcon()} data-testid="sermon-edit-box">
    <ErrorMessages errors={errors} data-testid="sermon-errors" />
    <>
      {!currentSermon?.permanentUrl && (
        <FormControl fullWidth>
          <InputLabel>Playlist</InputLabel>
          <Select label="Playlist" name="playlistId" value={currentSermon?.playlistId || ""} onChange={handleChange} data-testid="sermon-playlist-select" aria-label="Select playlist">
            <MenuItem value="">None</MenuItem>
            {getPlaylists()}
          </Select>
        </FormControl>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Video Provider</InputLabel>
            <Select label="Video Provider" name="videoType" value={currentSermon?.videoType || ""} onChange={handleChange} data-testid="video-provider-select" aria-label="Select video provider">
              {currentSermon?.permanentUrl && (<MenuItem value="youtube_channel">Current YouTube Live Stream</MenuItem>)}
              <MenuItem value="youtube">YouTube</MenuItem>
              <MenuItem value="vimeo">Vimeo</MenuItem>
              <MenuItem value="facebook">Facebook</MenuItem>
              <MenuItem value="custom">Custom Embed Url</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField fullWidth label={keyLabel} name="videoData" value={currentSermon?.videoData || ""} onChange={handleChange} placeholder={keyPlaceholder}
            InputProps={{ endAdornment: endAdornment }}
            data-testid="video-data-input"
            aria-label="Video ID or URL"
          />
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        {!currentSermon?.permanentUrl && (
          <Grid size={{ xs: 6 }}>
            <label style={{ width: "100%" }}>Publish Date</label>
            <TextField fullWidth type="date" name="publishDate" value={(currentSermon?.publishDate) ? DateHelper.formatHtml5Date(DateHelper.toDate(currentSermon?.publishDate)) : ""} onChange={handleChange} placeholder={keyPlaceholder} data-testid="publish-date-input" aria-label="Publish date" />
          </Grid>
        )}
        <Grid size={{ xs: 6 }}>
          <label style={{ width: "100%" }}>Total Sermon Duration</label>
          <Duration totalSeconds={currentSermon?.duration || 0} updatedFunction={totalSeconds => { let s = { ...currentSermon }; s.duration = totalSeconds; setCurrentSermon(s); }} />
        </Grid>

      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 3 }}>
          <a href="about:blank" onClick={(e) => { e.preventDefault(); props.showPhotoEditor("sermon", currentSermon?.thumbnail || ""); }} data-testid="edit-thumbnail-link" aria-label="Edit sermon thumbnail">
            <img src={currentSermon?.thumbnail || "/images/no-image.png"} className="img-fluid" style={{ marginTop: 20 }} alt="Sermon thumbnail" data-testid="sermon-thumbnail"></img>
          </a>
        </Grid>
        <Grid size={{ xs: 9 }}>
          <TextField fullWidth label="Title" name="title" value={currentSermon?.title || ""} onChange={handleChange} data-testid="sermon-title-input" aria-label="Sermon title" />
          <TextField fullWidth multiline label="Description" name="description" value={currentSermon?.description || ""} onChange={handleChange} placeholder={keyPlaceholder} data-testid="sermon-description-input" aria-label="Sermon description" />
        </Grid>
      </Grid>

      {/* add to another playlist */}
      <div style={{ marginTop: 15 }}>
        <a href="about:blank" onClick={(e) => { e.preventDefault(); setShowOption(!showOption) }} data-testid="add-to-playlist-link" aria-label="Add sermon to another playlist">Add to another playlist</a>
        {showOption && (
          <FormControl fullWidth>
            <InputLabel>Playlist</InputLabel>
            <Select label="Playlist" name="additionalPlaylistId" value={additionalPlaylistId} onChange={(e) => { e.preventDefault(); setAdditionalPlaylistId(e.target.value) }}
              endAdornment={<Button variant="contained" size="small" disabled={!additionalPlaylistId || additionalPlaylistId === ""} onClick={handleAdd} data-testid="add-to-playlist-button" aria-label="Add to selected playlist">add</Button>}
              data-testid="additional-playlist-select"
              aria-label="Select additional playlist"
            >
              {getAdditionalPlaylists()}
            </Select>
          </FormControl>
        )}
      </div>
    </>
  </InputBox>
  {showB1Share && <B1ShareModal contentDisplayName={currentSermon.title} contentType="sermon" contentId={currentSermon.id} onClose={() => { setShowB1Share(false); }} /> }
  </>);
}
