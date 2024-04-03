import React from "react";
import { ArrayHelper, DateHelper, DisplayBox } from "@churchapps/apphelper";
import { AssignmentInterface, PlanInterface, PositionInterface } from "@/helpers";
import { TableRow, TableCell, Table, TableHead, TableBody } from "@mui/material";
import Link from "next/link";

interface Props {
  plans: PlanInterface[];
  positions: PositionInterface[];
  assignments: AssignmentInterface[];
}

export const ServingTimes: React.FC<Props> = (props) => {

  const getRows = () => {
    const data:any[] = [];
    props.assignments.forEach((assignment) => {
      const position = props.positions.find(p => p.id === assignment.positionId);
      const plan = props.plans.find(p => p.id === position.planId);
      if (position && plan) data.push({ assignmentId:assignment.id, planId: plan.id, planName:plan.name, serviceDate: new Date(plan.serviceDate), position: position.name, status:"Unconfirmed" });
    });
    ArrayHelper.sortBy(data, "serviceDate", true)
    const rows:JSX.Element[] = [];
    data.forEach((d) => {
      rows.push(
        <TableRow key={d.planId}>
          <TableCell><Link href={"/member/plans/" + d.planId}>{d.planName}</Link></TableCell>
          <TableCell>{DateHelper.prettyDate(d.serviceDate)}</TableCell>
          <TableCell>{d.position}</TableCell>
          <TableCell>{d.status}</TableCell>
        </TableRow>
      );
    });
    return rows;
  }

  return (<DisplayBox headerIcon="assignment" headerText="Serving Times">
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Plan</TableCell>
          <TableCell>Service Date</TableCell>
          <TableCell>Role</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {getRows()}
      </TableBody>
    </Table>
  </DisplayBox>);
}

