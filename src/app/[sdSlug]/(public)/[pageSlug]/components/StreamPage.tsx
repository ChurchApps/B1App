"use client";

import { LiveStream } from "@/components/video/LiveStream";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Locale } from "@churchapps/apphelper";
import { Container } from "@mui/material";


type Props = {
  config?: ConfigurationInterface;
  title: string;
};

export function StreamPage(props: Props) {

  const day = 1; // getDayOfYear();

  return (
    <Container>
      <h1 style={{ textAlign: "center" }}>{props.title}</h1>
      <LiveStream includeHeader={false} includeInteraction={true} keyName={props.config?.church?.subDomain || ""} appearance={props.config!.appearance} />
    </Container>
  );
}
