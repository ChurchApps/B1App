"use client";

import React, { useEffect, useState } from "react";
import { EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import type { EventInterface, GroupInterface, GroupMemberInterface } from "@churchapps/apphelper/dist/helpers/Interfaces";
import { GroupContact } from "./GroupContact";
import { GroupHero } from "./GroupHero";
import { Avatar, Container, Grid } from "@mui/material";

interface Props {
  config: ConfigurationInterface
  group: GroupInterface;
  events: EventInterface[];
  leaders: GroupMemberInterface[];
}

export function UnauthenticatedView(props: Props) {

  EnvironmentHelper.init();
  const getLeaders = () => {
    const result: React.ReactElement[] = [];
    props.leaders.forEach((l) => {
      result.push(<Grid container item xs={6} md={2} key={l.person.id} style={{ height: "50px", backgroundColor: "hsl(0, 0%, 85%)", marginLeft: "5px", borderRadius: "40px" }}>
        <Grid item md={4} style={{ padding: "5px" }}>
          <Avatar src={l.person.photo ? EnvironmentHelper.Common.ContentRoot + l.person.photo : EnvironmentHelper.Common.ContentRoot + "/public/images/sample-profile.png"} />
        </Grid>
        <Grid item md={8} style={{ lineHeight: "50px" }}><a href={"/my/community/" + l.person.id} style={{ color: "black" }}>{l.person.name.display}</a></Grid>
      </Grid>);
    });
    return result;
  }

  const [hidden, setHidden] = useState("block");
  const [shift, setShift] = useState(8);
  const [events, setEvents] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    const result: React.ReactElement[] = [];
    const currDate = new Date();

    props.events.forEach((e) => {
      const startDate = new Date(e.start);
      const monthAbb = startDate.toLocaleString('en-US', { month: 'short' });
      const dayShort = startDate.toLocaleString('en-Us', { day: '2-digit' });

      if (result.length < 3 && startDate > currDate) {
        result.push(<Grid container key={e.id}>
          <Grid container item xs={4} md={4} style={{ height: "80px", marginBottom: "10px" }}>
            <Grid item xs={5} md={5}></Grid>
            <Grid item xs={7} md={7} className="calbox" style={{ lineHeight: "80px", borderRadius: "15%", fontWeight: "bold" }}>
              <p style={{ lineHeight: "16px" }}>{monthAbb}</p>
              <p style={{ lineHeight: "16px" }}>{dayShort}</p>
            </Grid>
          </Grid>
          <Grid item xs={8} md={8} style={{ textAlign: "left", lineHeight: "40px", paddingLeft: "5px" }}>
            <div style={{ fontWeight: "bold" }}>{e.title}</div>
            <div style={{ fontStyle: "italic" }}>{e.description}</div>
          </Grid>
        </Grid>);
      }
    });

    if (result.length === 0) {
      setHidden("none");
      setShift(12);
    } else {
      setHidden("block");
      setShift(8);
    }

    setEvents(result);
  }, [props.events]);

  return <>


    <GroupHero group={props.group} />
    <Container>

      <div style={{ textAlign: "center", marginTop: "40px" }}>

        <p style={{ padding: "0px 20px", fontSize: "22px", textAlign: "left" }}>{props.group.about}</p>

        <Grid container style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left", lineHeight: "50px" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Leader(s): </span>
          {getLeaders()}
        </Grid>
      </div>

      <Grid container spacing={4}>
        <Grid item md={shift} xs={12} style={{ textAlign: "center" }}>
          <GroupContact group={props.group} leaders={props.leaders} config={props.config} />
        </Grid>

        <Grid item md={4} xs={12} style={{ display: hidden, textAlign: "center" }} id="calEntity">
          <h2 style={{ padding: "20px 0px", margin: "15px 0px" }}>Calendar Events:</h2>
          {events}
        </Grid>
      </Grid>


    </Container>

  </>


}
