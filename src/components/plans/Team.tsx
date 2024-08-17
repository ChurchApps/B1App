import React from "react";
import { AssignmentInterface, DisplayBox, PersonHelper, PersonInterface, PositionInterface } from "@churchapps/apphelper";
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
    const rows:JSX.Element[] = [];
    props.positions.forEach((position) => {
      const posAssignments = props.assignments.filter(a => a.positionId === position.id);
      posAssignments.forEach((assignment) => {
        const person = props.people.find(p => p.id === assignment.personId);
        rows.push(
          <TableRow key={assignment.id}>
            <TableCell style={{width:70}}>
              <img src={PersonHelper.getPhotoUrl(person)} alt="avatar" style={{maxWidth: "50px"}} />
            </TableCell>
            <TableCell>
              <Link href={"/member/directory/" + person?.id}>{person?.name?.display}</Link>
              <div>{position.name}</div>
            </TableCell>
          </TableRow>
        );
      });
    });

    return rows;
  }

  return (<DisplayBox headerIcon="people" headerText={props.name}>
    <Table size="small">
      <TableBody>
        {getTeam()}
      </TableBody>
    </Table>
  </DisplayBox>);
}

