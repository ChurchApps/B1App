import React from "react";
import { DisplayBox } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import type { AssignmentInterface, PersonInterface, PositionInterface } from "@churchapps/helpers";
import { TableRow, TableCell, Table, TableBody } from "@mui/material";
import Link from "next/link";

interface Props {
  positions: PositionInterface[];
  assignments: AssignmentInterface[];
  people: PersonInterface[];
  name: string;
}

export const Team: React.FC<Props> = (props) => {

  const getTeam = () => {
    if (!props.people) return;
    const rows:React.ReactElement[] = [];
    props.positions.forEach((position) => {
      const posAssignments = props.assignments.filter((a) => a.positionId === position.id);
      posAssignments.forEach((assignment) => {
        const person = props.people.find((p) => p.id === assignment.personId);
        rows.push(
          <TableRow key={assignment.id}>
            <TableCell style={{width:70}}>
              <img src={PersonHelper.getPhotoUrl(person)} alt="avatar" style={{maxWidth: "50px"}} />
            </TableCell>
            <TableCell>
              <Link href={"/my/community/" + person?.id}>{person?.name?.display}</Link>
              <div>{position.name}</div>
            </TableCell>
          </TableRow>
        );
      });
    });

    return rows;
  }

  return (<DisplayBox headerIcon="people" headerText={props.name} data-testid={`team-${props.name.toLowerCase().replace(/\s+/g, '-')}-display-box`}>
    <Table size="small">
      <TableBody>
        {getTeam()}
      </TableBody>
    </Table>
  </DisplayBox>);
}

