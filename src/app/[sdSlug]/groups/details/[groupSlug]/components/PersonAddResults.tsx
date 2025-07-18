"use client";

import React, { useEffect, useState } from "react";

import { PersonInterface } from "@churchapps/helpers"
import { Table, TableBody, TableRow, TableCell } from "@mui/material";
import { SmallButton } from "@churchapps/apphelper/dist/components/SmallButton";


interface Props {
  addFunction: (person: PersonInterface) => void;
  getPhotoUrl: (person: PersonInterface) => string;
  includeEmail?: boolean;
  actionLabel?: string;
  searchResults: PersonInterface[];
}

export const PersonAddResults: React.FC<Props> = (props: Props) => {
  const [searchResults, setSearchResults] = useState<PersonInterface[]>(null);

  useEffect(() => { setSearchResults(props.searchResults); }, [props.searchResults]);

  if (!searchResults) return null;

  const handleAdd = (person: PersonInterface) => {
    let sr: PersonInterface[] = [...searchResults];
    const idx = sr.indexOf(person);
    sr.splice(idx, 1);
    setSearchResults(sr);
    props.addFunction(person);
  }


  let rows = [];
  for (let i = 0; i < searchResults.length; i++) {
    const sr = searchResults[i];

    rows.push(
      <TableRow key={sr.id}>
        <TableCell><img src={props.getPhotoUrl(sr)} alt="avatar" style={{width:50, height:40, borderRadius:8}} /></TableCell>
        <TableCell>{sr.name.display}{props.includeEmail && (<><br /><i style={{ color: "#999" }}>{sr.contactInfo.email}</i></>)}</TableCell>
        <TableCell>
          <SmallButton color="success" icon="person" text={props.actionLabel || "Add"} onClick={() => handleAdd(sr)} />
        </TableCell>
      </TableRow>
    );
  }

  return (<Table size="small" id="householdMemberAddTable"><TableBody>{rows}</TableBody></Table>);
}
