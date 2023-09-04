import Link from "next/link";
import { Container, TextField } from "@mui/material";
import { MarkdownEditor, MarkdownPreview } from "@churchapps/apphelper";
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
      <h3>Editor</h3>
      <MarkdownEditor value={val} onChange={(v) => {
        setVal(v)
      }} />
      <h3>Markdown</h3>
      <TextField multiline fullWidth value={val} />
      <h3>Preview</h3>
      <MarkdownPreview value={val} />

    </Container>

  );
}
