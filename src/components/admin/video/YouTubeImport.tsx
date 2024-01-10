import { ErrorMessages, InputBox } from "@churchapps/apphelper";
import { ApiHelper, PlaylistInterface, SermonInterface } from "@churchapps/apphelper";
import { Checkbox, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField } from "@mui/material";
import React from "react";

interface Props {
  handleDone: () => void;
}

export const YouTubeImport = (props: Props) => {
  const [selectedSermons, setSelectedSermons] = React.useState<SermonInterface[]>([]);
  const [sermons, setSermons] = React.useState<SermonInterface[]>(null);
  const [channelId, setChannelId] = React.useState("");
  const [playlistId, setPlaylistId] = React.useState("");
  const [playlists, setPlaylists] = React.useState<PlaylistInterface[]>([]);
  const [errors, setErrors] = React.useState([]);
  const [isFetching, setIsFetching] = React.useState(false);

  const loadData = () => {
    ApiHelper.get("/playlists", "ContentApi").then((data) => { setPlaylists(data); });
  };

  const handleCheck = (sermon:SermonInterface, checked: boolean) => {
    let newSelectedSermons = [...selectedSermons];
    if (checked) newSelectedSermons.push(sermon);
    else newSelectedSermons = newSelectedSermons.filter((s) => s.videoData !== sermon.videoData);
    setSelectedSermons(newSelectedSermons);
  }

  const getRows = () => {
    let rows: JSX.Element[] = [];
    sermons.forEach((ser) => {
      const sermon = ser;
      rows.push(<TableRow key={sermon.videoData}>
        <TableCell>
          <Checkbox onChange={(e) => handleCheck(sermon, e.currentTarget.checked)} checked={ selectedSermons.filter(s => s.videoData === sermon.videoData).length > 0 } />
        </TableCell>
        <TableCell>{sermon.title}</TableCell>
      </TableRow>);
    });
    return rows;
  };

  const getTable = () => (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Import</TableCell>
          <TableCell>Title</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>{getRows()}</TableBody>
    </Table>
  );


  React.useEffect(() => { loadData(); }, []);

  const handleFetch = () => {
    setIsFetching(true);
    ApiHelper.get("/sermons/youtubeImport/" + channelId, "ContentApi").then((data) => { setSermons(data); setIsFetching(false); });
  }

  const handleSave = () => {
    if (playlistId === "") setErrors(["Please select a playlist"]);
    else {
      let data = [...selectedSermons];
      data.forEach((sermon) => { sermon.playlistId = playlistId; });
      ApiHelper.post("/sermons", data, "ContentApi").then(() => { props.handleDone(); });
    }
  }

  if (!sermons) {
    return (<>
      <ErrorMessages errors={errors} />
      <InputBox headerIcon="video_library" headerText="Import" saveText={isFetching ? "Fetching..." : "Fetch"} saveFunction={handleFetch} cancelFunction={props.handleDone} isSubmitting={isFetching}>
        <TextField fullWidth label="Youtube Channel ID" name="channelId" value={channelId} onChange={(e) => { setChannelId(e.target.value); }} placeholder="UCfiDl90gAfZMkgbeCqX1WiA" />
      </InputBox>
    </>);
  }
  else
    return (<>
      <ErrorMessages errors={errors} />
      <InputBox headerIcon="video_library" headerText="Import" saveText="Import" saveFunction={handleSave} cancelFunction={props.handleDone}>
        <FormControl fullWidth>
          <InputLabel>Import Into Playlist</InputLabel>
          <Select fullWidth label="Import Into Playlist" name="playlistId" value={playlistId} onChange={(e) => { setPlaylistId(e.target.value); }}>
            {playlists.map((playlist) => (<MenuItem key={playlist.id} value={playlist.id}>{playlist.title}</MenuItem>))}
          </Select>
        </FormControl>
        {getTable()}
      </InputBox>
    </>);
};