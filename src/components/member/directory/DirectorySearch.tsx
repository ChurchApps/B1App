import { Button, TextField, Icon, Box } from "@mui/material";
import React from "react";
import { ApiHelper, DisplayBox } from "@churchapps/apphelper"
import { PeopleSearchResults } from "./PeopleSearchResults"

interface Props { selectedHandler: (personId: string) => void }

export const DirectorySearch: React.FC<Props> = (props) => {

  const [searchText, setSearchText] = React.useState("");
  const [searchResults, setSearchResults] = React.useState(null);

  const handleSubmit = (e: React.MouseEvent) => {
    if (e !== null) e.preventDefault();
    let term = escape(searchText.trim());
    ApiHelper.get("/people/search?term=" + term, "MembershipApi").then(data => setSearchResults(data));
  }

  const loadData = () => {
    ApiHelper.get("/people/recent", "MembershipApi").then(data => { setSearchResults(data) });
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.currentTarget.value);

  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(null); } }

  React.useEffect(loadData, []);

  return (
    <>
      <h1><Box sx={{ display: "flex", alignItems: "center" }}><Icon sx={{ marginRight: "5px" }}>person</Icon>Member Directory</Box></h1>
      <DisplayBox id="peopleBox" headerIcon="person" headerText="Search">
        <TextField fullWidth label="Name" id="searchText" data-cy="search-input" name="searchText" type="text" placeholder="Name" value={searchText} onChange={handleChange} onKeyDown={handleKeyDown}
          InputProps={{ endAdornment: <Button variant="contained" id="searchButton" data-cy="search-button" onClick={handleSubmit}>Search</Button> }}
        />
        <br />
        <PeopleSearchResults people={searchResults} selectedHandler={props.selectedHandler} />
      </DisplayBox>

    </>
  )
}
