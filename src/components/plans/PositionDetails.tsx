import React from "react";
import { ApiHelper, InputBox } from "@churchapps/apphelper";
import { AssignmentInterface, PositionInterface, TimeInterface } from "@/helpers";
import { Alert } from "@mui/material";
import { DateHelper } from "@churchapps/helpers";

interface Props {
  position: PositionInterface;
  assignment: AssignmentInterface;
  times: TimeInterface[];
  onUpdate: () => void;
}

export const PositionDetails: React.FC<Props> = (props) => {

  const getStatus = () => {
    switch (props.assignment.status) {
      case "Accepted": return <Alert severity="success"><b>Status:</b> Accepted</Alert>;
      case "Declined": return <Alert severity="error"><b>Status:</b> Declined</Alert>;
      default: return <Alert severity="warning"><b>Status:</b> Unconfirmed</Alert>;
    }
  }

  const getTimes = () => {
    const rows:JSX.Element[] = [];
    const times = props.times.sort((a,b) => a.startTime > b.startTime ? 1 : -1);
    props.times.forEach((time) => {
      rows.push(<li key={time.id}><b>{time.displayName}:</b> {DateHelper.prettyDateTime(new Date(time.startTime))} - {DateHelper.prettyTime(new Date(time.endTime))}</li>);
    });
    return rows;
  }

  const config = ApiHelper.getConfig("DoingApi");

  const handleAccept = () => {
    ApiHelper.post("/assignments/accept/" + props.assignment.id, [], "DoingApi").then(() => { props.onUpdate(); });
  }

  const handleDecline = () => {
    ApiHelper.post("/assignments/decline/" + props.assignment.id, [], "DoingApi").then(() => { props.onUpdate(); });
  }

  return (<InputBox headerIcon="event" headerText={"Position: " + props.position.name} saveText="Accept" saveFunction={handleAccept} deleteFunction={handleDecline}>
    {getStatus()}
    <br />
    <b>Needed Times:</b>
    <ul>
      {getTimes()}
    </ul>

  </InputBox>);
}

