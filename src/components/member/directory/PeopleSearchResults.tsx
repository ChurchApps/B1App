import React from "react";
import Link from "next/link";
import { PersonHelper } from "@churchapps/apphelper/dist/helpers/PersonHelper";
import type { PersonInterface } from "@churchapps/helpers";
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
        <TableCell><Link href={"/my/community/" + p.id}>{p.name.display}</Link></TableCell>
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
