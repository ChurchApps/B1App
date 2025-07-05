"use client";

import { SermonElement } from "@/components/elementTypes/SermonElement";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { Container } from "@mui/material";


type Props = {
  config?: ConfigurationInterface;
};

export function SermonsPage(props:Props) {

  const day = 1; // getDayOfYear();

  return (
    <Container>
      <h1 style={{textAlign:"center"}}>Sermons</h1>
      <SermonElement key={"sermons"} churchId={props.config?.church?.id} appearance={props.config?.appearance}  />
    </Container>
  );
}
