"use client";

import type { GroupInterface } from "@churchapps/helpers";
import { Container, Grid } from "@mui/material";
import Image from "next/image";

 interface Props {
  group?: GroupInterface;
}

export function GroupHero(props: Props) {
  return ( <div id="groupHero">
    <div className="content">
      <Container fixed>
        <Grid container spacing={2}>
          <Grid size={{ md: 7, xs: 12 }}>
            <h1>{props.group.name}</h1>
            <div style={{paddingTop:20}}>{props.group.meetingTime}</div>
            <div style={{paddingTop:10}}>{props.group.meetingLocation}</div>
          </Grid>
        </Grid>

        <div style={{height:30}}></div>
        <Image className="badge" src={props.group.photoUrl} alt={props.group.name} width={320} height={180} style={{width:320}} />
      </Container>
      <div style={{height:10}}></div>
    </div>
  </div>)
}
