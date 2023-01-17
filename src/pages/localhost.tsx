import Link from "next/link";
import { Container } from "@mui/material";
import { MarkdownEditor } from "@/components";
import { useState } from "react";

export default function Localhost() {
  const [val, setVal] = useState("");

  return (

    <Container>
      <p>Select a site:</p>
      <Link href="http://crcc.localhost:3000">CRCC</Link>
      <br />
      <Link href="http://ironwood.localhost:3000">Ironwood</Link>
      <br />
      <Link href="http://crcc.localhost:3000">LiveCS Home</Link>
      <br />
      <br />
      <Link href="http://ironwood.localhost:3000/admin">Admin</Link>
      <br />
      <br />
      <MarkdownEditor value={val} onChange={(v) => { setVal(v) }} />
    </Container>

  );
}
