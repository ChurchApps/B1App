import { Loading, DisplayBox } from "@churchapps/apphelper";
import { SermonInterface, PlaylistInterface, ApiHelper, UserHelper, ArrayHelper, DateHelper } from "@churchapps/apphelper";
import { Icon, IconButton, Menu, MenuItem, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import React from "react";
import { SermonEdit } from "./SermonEdit";

interface Props {
  showPhotoEditor: (photoType: string, url: string) => void,
  updatedPhoto: string
}

export const Sermons = (props: Props) => {
  const [sermons, setSermons] = React.useState<SermonInterface[]>([]);
  const [playlists, setPlaylists] = React.useState<PlaylistInterface[]>([]);
  const [currentSermon, setCurrentSermon] = React.useState<SermonInterface>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleUpdated = () => { setCurrentSermon(null); loadData(); }
  //const getEditContent = () => <SmallButton icon="add" text="Add" onClick={handleAdd} />

  const getEditContent = () => {
    const open = Boolean(anchorEl);
    return (<>
      <IconButton aria-label="addButton" id="addBtnGroup" data-cy="add-button" aria-controls={open ? "add-menu" : undefined} aria-expanded={open ? "true" : undefined} aria-haspopup="true" onClick={(e) => { setAnchorEl(e.currentTarget); }}>
        <Icon color="primary">add</Icon>
      </IconButton>
      <Menu id="add-menu" MenuListProps={{ "aria-labelledby": "addBtnGroup" }} anchorEl={anchorEl} open={open} onClose={() => { setAnchorEl(null); }}>
        <MenuItem data-cy="add-campus" onClick={() => { setAnchorEl(null);; handleAdd(false); }}>
          Add Sermon
        </MenuItem>
        <MenuItem aria-label="addService" data-cy="add-service" onClick={() => { setAnchorEl(null); handleAdd(true) }}>
          Add Permanent Live Url
        </MenuItem>
      </Menu>
    </>);
  }

  const loadData = () => {
    ApiHelper.get("/playlists", "ContentApi").then(data => { setPlaylists(data); });
    ApiHelper.get("/sermons", "ContentApi").then(data => {
      setSermons(data);
      setIsLoading(false);
    });
  }

  const handleAdd = (permanentUrl: boolean) => {
    let v: SermonInterface = { churchId: UserHelper.currentUserChurch.church.id, duration: 5400, videoType: "youtube", videoData: "", title: "New Sermon", permanentUrl }
    if (permanentUrl) {
      v.videoType = "youtube_channel";
      v.videoData = "This is not your channel url - See help link above";
      v.title = "Current Live Service";
    }
    setCurrentSermon(v);
    loadData();
  }

  const getPlaylistTitle = (playlistId: string) => {
    let result = "";
    if (playlists) {
      const p: PlaylistInterface = ArrayHelper.getOne(playlists, "id", playlistId);
      if (p) result = p.title;
    }
    return result;
  }

  const getRows = () => {
    //var idx = 0;
    let rows: JSX.Element[] = [];
    sermons.forEach(video => {
      rows.push(
        <TableRow key={video.id}>
          <TableCell>{getPlaylistTitle(video.playlistId)}</TableCell>
          <TableCell>{video.title}</TableCell>
          <TableCell>{(video.publishDate) ? DateHelper.prettyDate(DateHelper.toDate(video.publishDate)) : "N/A"}</TableCell>
          <TableCell style={{ textAlign: "right" }}>
            <a href="about:blank" onClick={(e: React.MouseEvent) => { e.preventDefault(); setCurrentSermon(video); }}><Icon>edit</Icon></a>
          </TableCell>
        </TableRow>
      );
      //idx++;
    })
    return rows;
  }

  const getTable = () => {
    if (isLoading) return <Loading />
    else return (<Table>
      <TableHead>
        <TableRow>
          <TableCell>Playlist</TableCell>
          <TableCell>Sermon</TableCell>
          <TableCell>Publish Date</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {getRows()}
      </TableBody>
    </Table>);
  }

  React.useEffect(() => { loadData(); }, []);

  if (currentSermon !== null) return <SermonEdit currentSermon={currentSermon} updatedFunction={handleUpdated} showPhotoEditor={props.showPhotoEditor} updatedPhoto={props.updatedPhoto} />;
  else return (
    <DisplayBox headerIcon="live_tv" headerText="Sermons" editContent={getEditContent()} id="servicesBox">
      {getTable()}
    </DisplayBox>
  );
}
