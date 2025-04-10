"use client";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { ApiHelper, GalleryModal, GroupInterface, InputBox } from "@churchapps/apphelper";
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
    console.log("group is", props.group);
    EnvironmentHelper.initLocale();
  }, [props.group])

  const hideForm = () => {
    if (hidden === "none") {
      setHidden("block");
      console.log("showing")
    } else {
      setHidden("none");
      console.log("hiding")
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
    console.log(fe);
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
      <Button onClick={hideForm}><EditIcon /></Button>
    </div>

    <div>
      <form style={{ display: hidden, marginTop: 20 }}>
        <InputBox saveFunction={handleSubmit} cancelFunction={hideForm}>
          <TextField fullWidth label="Group Name" name="name" value={formEdits.name || ""} onChange={handleChange} />
          <TextField fullWidth label="Meeting Time" name="meetingTime" value={formEdits.meetingTime || ""} onChange={handleChange} />
          <TextField fullWidth label="Meeting Location" name="meetingLocation" value={formEdits.meetingLocation || ""} onChange={handleChange} />
          <TextField fullWidth label="Description" name="about" value={formEdits.about || ""} onChange={handleChange} multiline />
          {formEdits.photoUrl && (<>
            <img src={formEdits.photoUrl} style={{ maxHeight: 100, maxWidth: "100%", width: "auto" }} alt="group" />
            <br />
          </>)}
          {!formEdits.photoUrl && <InputLabel>Group Photo</InputLabel>}
          <Button variant="contained" onClick={() => setSelectPhotoField("photoUrl")}>Select Photo</Button>
        </InputBox>

        {selectPhotoField && (
          <GalleryModal
            onClose={() => setSelectPhotoField(null)}
            onSelect={handlePhotoSelected}
            aspectRatio={1.78}
          />
        )}
      </form>
    </div>
  </>
}
