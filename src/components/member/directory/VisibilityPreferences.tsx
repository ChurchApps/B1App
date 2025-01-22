import { Grid, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { InputBox } from "@churchapps/apphelper";

export const VisibilityPreferences = () => {
  return (
    <InputBox headerText="Visibility Preferences" saveFunction={() => {}}>
      <p>Choose how you would like to show your private info.</p>
      <Grid container spacing={{ xs: 0, sm: 1, md: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel id="address">Address</InputLabel>
            <Select fullWidth labelId="address" label="Address">
              <MenuItem value="everyone">Everyone</MenuItem>
              <MenuItem value="members">Members</MenuItem>
              <MenuItem value="groups">My Groups Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel id="phone">Phone Number</InputLabel>
            <Select fullWidth labelId="phone" label="Phone Number">
              <MenuItem value="everyone">Everyone</MenuItem>
              <MenuItem value="members">Members</MenuItem>
              <MenuItem value="groups">My Groups Only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="email">Email</InputLabel>
            <Select fullWidth labelId="email" label="Email">
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
