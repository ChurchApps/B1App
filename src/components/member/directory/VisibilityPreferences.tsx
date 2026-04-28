import { useEffect, useState } from "react";
import { Grid, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { InputBox } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import type { VisibilityPreferenceInterface } from "@churchapps/helpers";

export const VisibilityPreferences = () => {
  const [pref, setPref] = useState<VisibilityPreferenceInterface>({ address: "", phoneNumber: "", email: "" } as VisibilityPreferenceInterface);

  const initData = () => {
    ApiHelper.get("/visibilityPreferences/my", "MembershipApi").then((data: VisibilityPreferenceInterface) => {
      setPref({
        ...data,
        address: data?.address || "members",
        phoneNumber: data?.phoneNumber || "members",
        email: data?.email || "members"
      });
    });
  };

  const handlePrefChange = (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>) => {
    const p = { ...pref } as VisibilityPreferenceInterface;
    const value = e.target.value;
    switch (e.target.name) {
      case "address": p.address = value; break;
      case "phoneNumber": p.phoneNumber = value; break;
      case "email": p.email = value; break;
    }
    setPref(p);
  };

  const handleSave = () => {
    ApiHelper.post("/visibilityPreferences", [pref], "MembershipApi").then(() => {
      alert(Locale.label("member.directory.changesSaved"));
    }).finally(() => { initData(); });
  };

  useEffect(initData, []);

  return (
    <InputBox headerText={Locale.label("member.directory.visibilityPreferences")} saveFunction={handleSave}>
      <p>{Locale.label("member.directory.visibilityIntro")}</p>
      <Grid container spacing={{ xs: 0, sm: 1, md: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="address">{Locale.label("member.directory.address")}</InputLabel>
            <Select fullWidth labelId="address" label={Locale.label("member.directory.address")} name="address" value={pref.address || ""} defaultValue="" onChange={handlePrefChange} data-testid="visibility-address-select">
              <MenuItem value="everyone">{Locale.label("member.directory.everyone")}</MenuItem>
              <MenuItem value="members">{Locale.label("member.directory.members")}</MenuItem>
              <MenuItem value="groups">{Locale.label("member.directory.myGroupsOnly")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="phone">{Locale.label("member.directory.phoneNumber")}</InputLabel>
            <Select fullWidth labelId="phone" label={Locale.label("member.directory.phoneNumber")} name="phoneNumber" value={pref.phoneNumber || ""} defaultValue="" onChange={handlePrefChange} data-testid="visibility-phone-select">
              <MenuItem value="everyone">{Locale.label("member.directory.everyone")}</MenuItem>
              <MenuItem value="members">{Locale.label("member.directory.members")}</MenuItem>
              <MenuItem value="groups">{Locale.label("member.directory.myGroupsOnly")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="email">{Locale.label("person.email")}</InputLabel>
            <Select fullWidth labelId="email" label={Locale.label("person.email")} name="email" value={pref.email || ""} defaultValue="" onChange={handlePrefChange} data-testid="visibility-email-select">
              <MenuItem value="everyone">{Locale.label("member.directory.everyone")}</MenuItem>
              <MenuItem value="members">{Locale.label("member.directory.members")}</MenuItem>
              <MenuItem value="groups">{Locale.label("member.directory.myGroupsOnly")}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </InputBox>
  );
};
