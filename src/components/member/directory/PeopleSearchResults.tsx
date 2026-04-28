import React from "react";
import Link from "next/link";
import { Locale } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import type { PersonInterface } from "@churchapps/helpers";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

interface Props {
  people: PersonInterface[],
  selectedHandler: (personId: string) => void
}

export const PeopleSearchResults: React.FC<Props> = (props) => {

  const getRows = () => {
    const result = [];
    for (let i = 0; i < props.people.length; i++) {
      const p = props.people[i];
      result.push(<TableRow key={p.id}>
        <TableCell><img src={PersonHelper.getPhotoUrl(p)} alt={Locale.label("member.directory.avatar")} /></TableCell>
        <TableCell><Link href={"/mobile/community/" + p.id} data-testid={`person-result-${p.id}-link`}>{p.name?.display}</Link></TableCell>
      </TableRow>);
    }
    return result;
  };

  if (props.people === undefined || props.people === null) return (<div className="alert alert-info">{Locale.label("member.directory.searchPrompt")}</div>);

  else if (props.people.length === 0) return (<p>{Locale.label("member.directory.noResults")}</p>);
  else {
    return (<Table id="peopleTable">
      <TableHead><TableRow><TableCell></TableCell><TableCell>{Locale.label("person.name")}</TableCell></TableRow></TableHead>
      <TableBody>{getRows()}</TableBody>
    </Table>);
  }
};
