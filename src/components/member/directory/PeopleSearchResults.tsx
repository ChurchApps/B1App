import React from "react";
import { PersonHelper } from "../../../appBase/helpers";
import { PersonInterface } from "../../../appBase/interfaces"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

interface Props {
  people: PersonInterface[],
  selectedHandler: (personId: string) => void
}

export const PeopleSearchResults: React.FC<Props> = (props) => {

  const getRows = () => {
    let result = [];
    for (let i = 0; i < props.people.length; i++) {
      const p = props.people[i];
      result.push(<TableRow key={p.id}>
        <TableCell><img src={PersonHelper.getPhotoUrl(p)} alt="avatar" /></TableCell>
        <TableCell><a href="about:blank" onClick={(e) => { e.preventDefault(); props.selectedHandler(p.id) }}>{p.name.display}</a></TableCell>
      </TableRow>);
    }
    return result;
  }

  if (props.people === undefined || props.people === null) return (<div className="alert alert-info">Use the search box above to search for a member or add a new one.</div>)

  else if (props.people.length === 0) return (<p>No results found.</p>);
  else return (<Table id="peopleTable">
    <TableHead><TableRow><TableCell></TableCell><TableCell>Name</TableCell></TableRow></TableHead>
    <TableBody>{getRows()}</TableBody>
  </Table>);
}
