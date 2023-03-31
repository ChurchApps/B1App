import Link from "next/link";
import { Container, TextField } from "@mui/material";
import { MarkdownEditor, MarkdownPreview } from "@/components";
import { useState } from "react";
import { EventCalendar } from "@/components/eventCalendar/EventCalendar";
import { GroupCalendar } from "@/components/eventCalendar/GroupCalendar";

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
      <GroupCalendar groupId="1234567890a" canEdit={false} />
      <br />
      <h3>Editor</h3>
      <MarkdownEditor value={val} onChange={(v) => { 
        console.log(v);
        setVal(v) 
      }} />
      <h3>Markdown</h3>
      <TextField multiline fullWidth value={val} />
      <h3>Preview</h3>
      <MarkdownPreview value={val} />
      
    </Container>

  );
}
