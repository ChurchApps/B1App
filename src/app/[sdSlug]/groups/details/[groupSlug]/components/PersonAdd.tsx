"use client";

import React, { useState } from "react";

import { PersonInterface } from "@churchapps/helpers"
import { TextField, Button, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
// // CreatePerson component not available
import { DisplayBox } from "@churchapps/apphelper";
import { PersonAddResults } from "./PersonAddResults";


interface Props {
  addFunction: (person: PersonInterface) => void;
  person?: PersonInterface;
  getPhotoUrl: (person: PersonInterface) => string;
  searchClicked?: () => void;
  filterList?: string[];
  includeEmail?: boolean;
  actionLabel?: string;
  showCreatePersonOnNotFound?: boolean;
}

export const PersonAdd: React.FC<Props> = ({ addFunction, getPhotoUrl, searchClicked, filterList = [], includeEmail = false, actionLabel, showCreatePersonOnNotFound = false }) => {
  const [searchResults, setSearchResults] = useState<PersonInterface[]>([]);
  const [searchText, setSearchText] = useState("");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { e.preventDefault(); setHasSearched(false); setSearchText(e.currentTarget.value); }
  const handleKeyDown = (e: React.KeyboardEvent<any>) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(null); } }

  const handleSearch = (e: React.MouseEvent) => {
    if (e !== null) e.preventDefault();
    let term = searchText.trim();
    ApiHelper.post("/people/search", { term: term }, "MembershipApi")
      .then((data: PersonInterface[]) => {
        setHasSearched(true);
        const filteredResult = data.filter((s: any) => !filterList.includes(s.id))
        setSearchResults(filteredResult);
        if (searchClicked) {
          searchClicked();
        }
      });
  }
  return (
    <DisplayBox key="displayBox" id="personAddBox" headerIcon="person" headerText={Locale.label("Add Person")} data-testid="person-add-box">
      <TextField fullWidth name="personAddText" label={Locale.label("person.person")} value={searchText} onChange={handleChange} onKeyDown={handleKeyDown}
        InputProps={{ endAdornment: <Button variant="contained" id="searchButton" data-cy="search-button" onClick={handleSearch} data-testid="search-person-button" aria-label="Search for person">{Locale.label("common.search")}</Button> }}
        data-testid="search-person-input"
        aria-label="Search for person by name"
      />
      {showCreatePersonOnNotFound && hasSearched && searchText && searchResults.length === 0 && (
        <Typography sx={{ marginTop: "7px" }}>{Locale.label("person.noRec")} <a href="about:blank" onClick={(e) => { e.preventDefault(); setOpen(true); }} data-testid="create-person-link" aria-label="Create new person">{Locale.label("createPerson.addNewPerson")}</a></Typography>
      )}
      <PersonAddResults addFunction={addFunction} getPhotoUrl={getPhotoUrl} includeEmail={includeEmail} actionLabel={actionLabel} searchResults={searchResults} />
      {/* CreatePerson component not available - open && <CreatePerson showInModal onClose={() => { setOpen(false); }} navigateOnCreate={false} onCreate={person => { setSearchText(""); setSearchResults([person]) }} data-testid="create-person-modal" /> */}
    </DisplayBox>
  );
}
