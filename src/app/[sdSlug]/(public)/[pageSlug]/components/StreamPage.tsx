"use client";

import { LiveStream } from "@/components/video/LiveStream";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Container } from "@mui/material";


type Props = {
  config?: ConfigurationInterface
};

export function StreamPage(props: Props) {

  const day = 1; // getDayOfYear();

  return (
    <Container>
      <h1 style={{ textAlign: "center" }}>Live Stream</h1>
      <LiveStream includeHeader={false} includeInteraction={true} keyName={props.config?.church?.subDomain} appearance={props.config?.appearance} offlineContent={null} />
    </Container>
  );
}
