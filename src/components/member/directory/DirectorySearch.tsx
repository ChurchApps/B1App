import { Button, TextField, Icon, Box, Stack, Chip, Divider, SelectChangeEvent, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import React from "react";
import { ApiHelper, DisplayBox, GroupInterface } from "@churchapps/apphelper"
import { PeopleSearchResults } from "./PeopleSearchResults"

interface Props { selectedHandler: (personId: string) => void }

export const DirectorySearch: React.FC<Props> = (props) => {

  const [searchText, setSearchText] = React.useState("");
  const [searchGroupId, setSearchGroupId] = React.useState("");
  const [searchResults, setSearchResults] = React.useState(null);
  const [searchCategory, setSearchCategory] = React.useState<"people" | "group">("people");
  const [groups, setGroups] = React.useState<GroupInterface[]>(null);

  const handleSubmit = (e: React.MouseEvent) => {
    if (e !== null) e.preventDefault();
    let term = encodeURIComponent(searchText.trim());
    if (searchCategory === "people") ApiHelper.get("/people/search?term=" + term, "MembershipApi").then(data => setSearchResults(data));
    else ApiHelper.get("/people/search/group?groupId=" + searchGroupId, "MembershipApi").then(data => setSearchResults(data));
  }

  const loadData = () => {
    ApiHelper.get("/people/directory/all", "MembershipApi").then(data => { setSearchResults(data) });
    ApiHelper.get("/groups", "MembershipApi").then((data: GroupInterface[]) => setGroups(data));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    if (e.target.name === "searchText") setSearchText(e.target.value);
    else setSearchGroupId(e.target.value);
  }

  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(null); } }

  const EndAdornment = () => (
    <Stack direction="row" alignItems="center">
      <Chip label="People" color="primary" size="small" icon={<Icon>person</Icon>} variant={searchCategory === "people" ? "filled" : "outlined"} clickable onClick={() => setSearchCategory("people")} sx={{ marginRight: "6px" }} />
      <Chip label="Group" color="primary" size="small" icon={<Icon>groups</Icon>} variant={searchCategory === "group" ? "filled" : "outlined"} clickable onClick={() => setSearchCategory("group")} />
      <Divider orientation="vertical" sx={{ height: 38, margin: 0.5, marginRight: 1, marginLeft: 1, borderRightWidth: 2 }} />
      <Button variant="contained" id="searchButton" data-cy="search-button" onClick={handleSubmit}>Search</Button>
    </Stack>
  )

  React.useEffect(loadData, []);

  return (
    <>
      <h1><Box sx={{ display: "flex", alignItems: "center" }}><Icon sx={{ marginRight: "5px" }}>person</Icon>Member Directory</Box></h1>
      <DisplayBox id="peopleBox" headerIcon="person" headerText="Search">
        {searchCategory === "people"
          ? (
            <TextField
              fullWidth
              label="Name"
              id="searchText"
              data-cy="search-input"
              name="searchText"
              type="text"
              placeholder="Name"
              value={searchText}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              InputProps={{ endAdornment: <EndAdornment /> }}
            />
          )
          : (
            <FormControl fullWidth>
              <InputLabel>Groups</InputLabel>
              <Select
                fullWidth
                label="Groups"
                name="searchGroupId"
                value={searchGroupId}
                onChange={handleChange}
                endAdornment={<EndAdornment />}
              >
                {groups?.map((g: GroupInterface) => (<MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>))}
              </Select>
            </FormControl>
          )}
        <br />
        <PeopleSearchResults people={searchResults} selectedHandler={props.selectedHandler} />
      </DisplayBox>

    </>
  )
}
