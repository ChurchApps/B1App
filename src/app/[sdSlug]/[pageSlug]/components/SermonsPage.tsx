"use client";

import { SermonElement } from "@/components/elementTypes/SermonElement";
import { ChurchInterface } from "@churchapps/apphelper";
import { Container } from "@mui/material";


type Props = {
  churchSettings?: any;
  church?: ChurchInterface;
};

export function SermonsPage(props:Props) {

  const day = 1; // getDayOfYear();

  return (
    <Container>
      <h1 style={{textAlign:"center"}}>Sermons</h1>
      <SermonElement key={"sermons"} churchId={props.church?.id} churchSettings={props.churchSettings} />
    </Container>
  );
}
