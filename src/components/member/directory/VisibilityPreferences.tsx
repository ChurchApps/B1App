import { useEffect, useState } from "react";
import { Grid, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { ApiHelper, InputBox } from "@churchapps/apphelper";

export const VisibilityPreferences = () => {
  const [pref, setPref] = useState<VisibilityPreferenceInterface>({ address: "", phoneNumber: "", email: "" } as VisibilityPreferenceInterface);

  const initData = () => {
    ApiHelper.get("/visibilityPreferences/my", "MembershipApi").then((data) => setPref(data));
  };

  const handlePrefChange = (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>) => {
    const p = { ...pref } as VisibilityPreferenceInterface;
    let value = e.target.value;
    switch (e.target.name) {
      case "address": p.address = value; break;
      case "phoneNumber": p.phoneNumber = value; break;
      case "email": p.email = value; break;
    }
    setPref(p);
  };

  const handleSave = () => {
    ApiHelper.post("/visibilityPreferences", [pref], "MembershipApi").then(() => {
      alert("Changes Saved.");
    });
  };

  useEffect(initData, []);

  return (
    <InputBox headerText="Visibility Preferences" saveFunction={handleSave}>
      <p>Choose how you would like to show your private info.</p>
      <Grid container spacing={{ xs: 0, sm: 1, md: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel id="address">Address</InputLabel>
            <Select fullWidth labelId="address" label="Address" name="address" value={pref.address} defaultValue="" onChange={handlePrefChange}>
              <MenuItem value="everyone">Everyone</MenuItem>
              <MenuItem value="members">Members</MenuItem>
              <MenuItem value="groups">My Groups Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel id="phone">Phone Number</InputLabel>
            <Select fullWidth labelId="phone" label="Phone Number" name="phoneNumber" value={pref.phoneNumber} defaultValue="" onChange={handlePrefChange}>
              <MenuItem value="everyone">Everyone</MenuItem>
              <MenuItem value="members">Members</MenuItem>
              <MenuItem value="groups">My Groups Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="email">Email</InputLabel>
            <Select fullWidth labelId="email" label="Email" name="email" value={pref.email} defaultValue="" onChange={handlePrefChange}>
              <MenuItem value="everyone">Everyone</MenuItem>
              <MenuItem value="members">Members</MenuItem>
              <MenuItem value="groups">My Groups Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </InputBox>
  );
};
