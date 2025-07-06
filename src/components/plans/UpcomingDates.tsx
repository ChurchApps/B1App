"use client";
import React from "react";
import { ArrayHelper } from "@churchapps/apphelper/dist/helpers/ArrayHelper";
import { DateHelper } from "@churchapps/apphelper/dist/helpers/DateHelper";
import { DisplayBox } from "@churchapps/apphelper/dist/components/DisplayBox";
import type { AssignmentInterface, PlanInterface, PositionInterface, TimeInterface } from "@churchapps/apphelper/dist/helpers/Interfaces";
import { TableRow, TableCell, Table, TableHead, TableBody } from "@mui/material";

interface Props {
  plans: PlanInterface[];
  positions: PositionInterface[];
  assignments: AssignmentInterface[];
  times: TimeInterface[];
}

export const UpcomingDates: React.FC<Props> = (props) => {

  const getData = () => {
    if (props.times?.length === 0) return [];
    const data:any[] = [];
    props.assignments.forEach((assignment) => {
      const position = props?.positions.find(p => p.id === assignment.positionId);
      const plan = props?.plans.find(p => p.id === position?.planId);
      const times:TimeInterface[] = ArrayHelper.getAll(props.times, "planId", plan?.id);
      times.forEach(t => {
        if (new Date(t.endTime) > new Date()) {
          if (t.teams?.indexOf(position.categoryName) > -1) {
            data.push({ timeId: t.id, timeName:t.displayName, startTime:new Date(t.startTime), status:"Unconfirmed" });
          }
        }
      });

    });
    ArrayHelper.sortBy(data, "startTime", false)

    return data;
  }

  const getRows = () => {
    const data = getData();

    const rows:JSX.Element[] = [];
    data.forEach((d) => {
      rows.push(
        <TableRow key={d.timeId}>
          <TableCell>{d.timeName}</TableCell>
          <TableCell>{DateHelper.prettyDateTime(d.startTime)}</TableCell>
        </TableRow>
      );
    });
    return rows;
  }

  return (<DisplayBox headerIcon="event" headerText="Upcoming Dates" data-testid="upcoming-dates-display-box">
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Event</TableCell>
          <TableCell>Start Time</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {getRows()}
      </TableBody>
    </Table>
  </DisplayBox>);
}

