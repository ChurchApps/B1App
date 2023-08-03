import React from "react";
import { TextField, SelectChangeEvent } from "@mui/material";
import { InputBox, ErrorMessages } from "@/appBase/components";
import { ApiHelper, DateHelper, PlaylistInterface, UniqueIdHelper, UserHelper, Permissions } from "@/helpers";

interface Props {
  currentPlaylist: PlaylistInterface,
  updatedFunction?: () => void,
  showPhotoEditor: (photoType: string, url: string) => void,
  updatedPhoto: string
}

export const PlaylistEdit: React.FC<Props> = (props) => {
  const [errors, setErrors] = React.useState<string[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = React.useState<PlaylistInterface>(null);
  const checkDelete = () => { if (!UniqueIdHelper.isMissing(currentPlaylist?.id)) return handleDelete; else return null; }
  const handleCancel = () => { props.updatedFunction(); }

  const handleDelete = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit)) errors.push("Unauthorized to delete playlists");

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    if (window.confirm("Are you sure you wish to delete this playlist?")) {
      ApiHelper.delete("/playlists/" + currentPlaylist.id, "ContentApi").then(() => { setCurrentPlaylist(null); props.updatedFunction(); });
    }
  }

  const handlePhotoUpdated = () => {
    if (props.updatedPhoto !== null && props.updatedPhoto !== currentPlaylist?.thumbnail) {
      const p = { ...currentPlaylist };
      p.thumbnail = props.updatedPhoto;
      props.showPhotoEditor("", null);
      setCurrentPlaylist(p);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const val = e.target.value;
    let v = { ...currentPlaylist };
    switch (e.target.name) {
      case "title": v.title = val; break;
      case "description": v.description = val; break;
      case "publishDate": v.publishDate = DateHelper.toDate(val); break;
    }
    setCurrentPlaylist(v);
  }

  const handleSave = () => {
    let errors = [];
    if (!UserHelper.checkAccess(Permissions.contentApi.streamingServices.edit)) errors.push("Unauthorized to create playlists");

    if (errors.length > 0){
      setErrors(errors);
      return;
    }

    ApiHelper.post("/playlists", [currentPlaylist], "ContentApi").then(props.updatedFunction);
  }

  React.useEffect(() => { setCurrentPlaylist(props.currentPlaylist); }, [props.currentPlaylist]);
  React.useEffect(handlePhotoUpdated, [props.updatedPhoto, currentPlaylist]); //eslint-disable-line

  return (
    <InputBox headerIcon="calendar_month" headerText="Edit Playlist" saveFunction={handleSave} cancelFunction={handleCancel} deleteFunction={checkDelete()} help="streaminglive/playlists">
      <ErrorMessages errors={errors} />
      <>
        <TextField fullWidth label="Title" name="title" value={currentPlaylist?.title || ""} onChange={handleChange} />
        <TextField fullWidth multiline label="Description" name="description" value={currentPlaylist?.description || ""} onChange={handleChange} />
        <label style={{ width: "100%" }}>Publish Date</label>
        <TextField fullWidth type="date" name="publishDate" value={(currentPlaylist?.publishDate) ? DateHelper.formatHtml5Date(DateHelper.toDate(currentPlaylist?.publishDate)) : ""} onChange={handleChange} />
        <a href="about:blank" onClick={(e) => { e.preventDefault(); props.showPhotoEditor("playlist", currentPlaylist?.thumbnail || ""); }}>
          <img src={currentPlaylist?.thumbnail || "/images/no-image.png"} className="img-fluid" style={{ marginTop: 20 }} alt="thumbnail"></img>
        </a>
      </>
    </InputBox>
  );
}
