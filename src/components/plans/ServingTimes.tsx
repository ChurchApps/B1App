import React from "react";
import { ArrayHelper, AssignmentInterface, DateHelper, DisplayBox, PlanInterface, PositionInterface } from "@churchapps/apphelper";
import { TableRow, TableCell, Table, TableHead, TableBody } from "@mui/material";
import Link from "next/link";

interface Props {
  plans: PlanInterface[];
  positions: PositionInterface[];
  assignments: AssignmentInterface[];
}

export const ServingTimes: React.FC<Props> = (props) => {

  const getStatusLabel = (status:string) => {
    let result = <div style={{color:"#ed6c02", fontWeight:"bold"}}>{status}</div>
    if (status==="Accepted") result = (<div style={{color:"#2e7d32", fontWeight:"bold"}}>{status}</div>);
    else if (status==="Declined") result = (<div style={{color:"#d32f2f", fontWeight:"bold"}}>{status}</div>);
    return result;
  }

  const getRows = () => {
    const data:any[] = [];
    props.assignments.forEach((assignment) => {
      const position = props?.positions.find(p => p.id === assignment.positionId);
      const plan = props?.plans.find(p => p.id === position?.planId);
      if (position && plan) data.push({ assignmentId:assignment.id, planId: plan.id, planName:plan.name, serviceDate: new Date(plan.serviceDate), position: position.name, status:assignment.status || "Unconfirmed" });
    });
    ArrayHelper.sortBy(data, "serviceDate", true)
    const rows:JSX.Element[] = [];
    data.forEach((d) => {
      rows.push(
        <TableRow key={d.planId}>
          <TableCell><Link href={"/member/plans/" + d.planId}>{d.planName}</Link></TableCell>
          <TableCell>{DateHelper.prettyDate(d.serviceDate)}</TableCell>
          <TableCell>{d.position}</TableCell>
          <TableCell>{getStatusLabel(d.status)}</TableCell>
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

