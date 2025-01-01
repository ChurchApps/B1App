"use client";

import { LiveStream } from "@/components/video/LiveStream";
import { ChurchInterface } from "@churchapps/apphelper";
import { Container } from "@mui/material";


type Props = {
  churchSettings?: any;
  church?: ChurchInterface;
};

export function StreamPage(props:Props) {

  const day = 1; // getDayOfYear();

  return (
    <Container>
      <h1 style={{textAlign:"center"}}>Live Stream</h1>
      <LiveStream includeHeader={false} includeInteraction={true} keyName={props.church?.subDomain} appearance={props.churchSettings} offlineContent={null} />
    </Container>
  );
}
