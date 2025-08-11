"use client";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { ApiHelper } from "@churchapps/apphelper";
import { GalleryModal } from "@churchapps/apphelper";
import { InputBox } from "@churchapps/apphelper";
import type { GroupInterface } from "@churchapps/helpers";
import { Button, InputLabel, SelectChangeEvent, TextField } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import { useEffect, useState } from "react";
import React from "react";
import { EnvironmentHelper } from "@/helpers";

interface Props {
  config: ConfigurationInterface
  group: GroupInterface;
  onChange: (group: GroupInterface) => void;
  updatedFunction: (group: GroupInterface) => void;
}

export function LeaderEdit(props: Props) {

  const [formEdits, setFormEdits] = useState<GroupInterface>(props.group);
  let [hidden, setHidden] = useState("none");
  const [selectPhotoField, setSelectPhotoField] = React.useState<string>(null);

  useEffect(() => {
    setFormEdits(props.group);
    EnvironmentHelper.initLocale();
  }, [props.group])

  const hideForm = () => {
    if (hidden === "none") {
      setHidden("block");
    } else {
      setHidden("none");
    }
    return;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const val = e.target.value;
    const fe = { ...formEdits }
    switch (e.target.name) {
      case "name": fe.name = val; break;
      case "meetingTime": fe.meetingTime = val; break;
      case "meetingLocation": fe.meetingLocation = val; break;
      case "about": fe.about = val; break;
    }
    setFormEdits(fe);
  }

  const handleSubmit = async () => {
    ApiHelper.post("/groups", [formEdits], "MembershipApi").then((groups: GroupInterface[]) => {
      hideForm();
      props.onChange(groups[0]);
    });
  }


  const handlePhotoSelected = (image: string) => {
    let fe = { ...formEdits };
    fe.photoUrl = image;
    setFormEdits(fe);
    setSelectPhotoField(null);
  };

  return <>
    <div style={{ textAlign: "right", float: "right", marginTop: 20 }}>
      <Button onClick={hideForm} data-testid="edit-group-button" aria-label="Edit group details"><EditIcon /></Button>
    </div>

    <div>
      <form style={{ display: hidden, marginTop: 20 }}>
        <InputBox saveFunction={handleSubmit} cancelFunction={hideForm} data-testid="group-edit-box">
          <TextField fullWidth label="Group Name" name="name" value={formEdits.name || ""} onChange={handleChange} data-testid="group-name-input" aria-label="Group name" />
          <TextField fullWidth label="Meeting Time" name="meetingTime" value={formEdits.meetingTime || ""} onChange={handleChange} data-testid="meeting-time-input" aria-label="Meeting time" />
          <TextField fullWidth label="Meeting Location" name="meetingLocation" value={formEdits.meetingLocation || ""} onChange={handleChange} data-testid="meeting-location-input" aria-label="Meeting location" />
          <TextField fullWidth label="Description" name="about" value={formEdits.about || ""} onChange={handleChange} multiline data-testid="group-description-input" aria-label="Group description" />
          {formEdits.photoUrl && (<>
            <img src={formEdits.photoUrl} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="Group photo" data-testid="group-photo" />
            <br />
          </>)}
          {!formEdits.photoUrl && <InputLabel>Group Photo</InputLabel>}
          <Button variant="contained" onClick={() => setSelectPhotoField("photoUrl")} data-testid="select-photo-button" aria-label="Select group photo">Select Photo</Button>
        </InputBox>

        {selectPhotoField && (
          <GalleryModal
            onClose={() => setSelectPhotoField(null)}
            onSelect={handlePhotoSelected}
            aspectRatio={1.78}
            data-testid="photo-gallery-modal"
          />
        )}
      </form>
    </div>
  </>
}
