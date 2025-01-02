"use client";

import { Container } from "@mui/material";

export function BiblePage() {


  return (
    <Container>
      <h1 style={{textAlign:"center"}}>Bible</h1>
      <iframe
        title="content"
        className="full-frame"
        src="https://biblia.com/api/plugins/embeddedbible?layout=normal&historyButtons=false&resourcePicker=false&shareButton=false&textSizeButton=false&startingReference=Ge1.1&resourceName=nirv"
      />
    </Container>
  );
}
