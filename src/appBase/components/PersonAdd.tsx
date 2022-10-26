import React, { useState } from "react";
import { ApiHelper } from "../helpers";
import { PersonInterface } from "../interfaces"
import { TextField, Button, Table, TableBody, TableRow, TableCell } from "@mui/material";
import { SmallButton } from "./SmallButton";

interface Props {
  addFunction: (person: PersonInterface) => void,
  person?: PersonInterface,
  getPhotoUrl: (person: PersonInterface) => string,
  searchClicked?: () => void,
  filterList?: string[]
  includeEmail?: boolean
  actionLabel?: string
}

export const PersonAdd: React.FC<Props> = ({ addFunction, getPhotoUrl, searchClicked, filterList = [], includeEmail = false, actionLabel }) => {
  const [searchResults, setSearchResults] = useState<PersonInterface[]>([]);
  const [searchText, setSearchText] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { e.preventDefault(); setSearchText(e.currentTarget.value); }
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(null); } }

  const handleSearch = (e: React.MouseEvent) => {
    if (e !== null) e.preventDefault();
    let term = searchText.trim();
    ApiHelper.post("/people/search", { term: term }, "MembershipApi")
      .then((data: PersonInterface[]) => {
        const filteredResult = data.filter(s => !filterList.includes(s.id))
        setSearchResults(filteredResult);
        if (searchClicked) {
          searchClicked();
        }
      });
  }
  const handleAdd = (person: PersonInterface) => {
    let sr: PersonInterface[] = [...searchResults];
    const idx = sr.indexOf(person);
    sr.splice(idx, 1);
    setSearchResults(sr);
    addFunction(person);
  }

  //<button className="text-success no-default-style" aria-label="addPerson" data-index={i} onClick={handleAdd}><Icon>person</Icon> Add</button>
  let rows = [];
  for (let i = 0; i < searchResults.length; i++) {
    const sr = searchResults[i];

    rows.push(
      <TableRow key={sr.id}>
        <TableCell><img src={getPhotoUrl(sr)} alt="avatar" /></TableCell>
        <TableCell>{sr.name.display}{includeEmail && (<><br /><i style={{ color: "#999" }}>{sr.contactInfo.email}</i></>)}</TableCell>
        <TableCell>
          <SmallButton color="success" icon="person" text={actionLabel || "Add"} ariaLabel="addPerson" onClick={() => handleAdd(sr)} />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <TextField fullWidth name="personAddText" label="Person" value={searchText} onChange={handleChange} onKeyDown={handleKeyDown}
        InputProps={{ endAdornment: <Button variant="contained" id="searchButton" data-cy="search-button" onClick={handleSearch}>Search</Button> }}
      />
      <Table size="small" id="householdMemberAddTable"><TableBody>{rows}</TableBody></Table>
    </>
  );
}
