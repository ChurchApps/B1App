import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";
import { Loading } from "@churchapps/apphelper/dist/components/Loading";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import { ApiHelper } from "@churchapps/apphelper/dist/helpers/ApiHelper";
import { UserHelper } from "@churchapps/apphelper/dist/helpers/UserHelper";
import type { PlaylistInterface } from "@churchapps/helpers";
import { Icon } from "@mui/material";
import React from "react";
import { PlaylistEdit } from "./PlaylistEdit";

interface Props {
  showPhotoEditor: (photoType: string, url: string) => void;
  updatedPhoto: string;
}

export const Playlists = (props: Props) => {
  const [playlists, setPlaylists] = React.useState<PlaylistInterface[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = React.useState<PlaylistInterface>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleUpdated = () => {
    setCurrentPlaylist(null);
    loadData();
  };
  const getEditContent = () => <SmallButton icon="add" text="Add" onClick={handleAdd} data-testid="add-playlist-button" />;
  const loadData = () => {
    ApiHelper.get("/playlists", "ContentApi").then((data) => {
      setPlaylists(data);
      setIsLoading(false);
    });
  };

  const handleAdd = () => {
    let v: PlaylistInterface = { churchId: UserHelper.currentUserChurch.church.id, title: "New Playlist", description: "", publishDate: new Date(), thumbnail: "" };
    setCurrentPlaylist(v);
    loadData();
  };

  const getRows = () => {
    //var idx = 0;
    let rows: React.ReactElement[] = [];
    playlists.forEach((playlist) => {
      rows.push(
        <tr key={playlist.id}>
          <td>{playlist.title}</td>
          <td style={{ textAlign: "right" }}>
            <a
              href="about:blank"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                setCurrentPlaylist(playlist);
              }}>
              <Icon>edit</Icon>
            </a>
          </td>
        </tr>
      );
      //idx++;
    });
    return rows;
  };

  const getTable = () => {
    if (isLoading) return <Loading />;
    else
      return (
        <table className="table">
          <tbody>{getRows()}</tbody>
        </table>
      );
  };

  React.useEffect(() => {
    loadData();
  }, []);

  if (currentPlaylist !== null) return <PlaylistEdit currentPlaylist={currentPlaylist} updatedFunction={handleUpdated} showPhotoEditor={props.showPhotoEditor} updatedPhoto={props.updatedPhoto} />;
  else
    return (
      <DisplayBox headerIcon="video_library" headerText="Playlists" editContent={getEditContent()} id="servicesBox" data-testid="playlists-display-box">
        {getTable()}
      </DisplayBox>
    );
};
