"use client"
import Link from "next/link";
import { Container, TextField } from "@mui/material";
import { useState } from "react";
import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(
  () => import("@churchapps/apphelper").then((mod) => mod.MarkdownEditor),
  { ssr: false } // disable server-side rendering if needed
);

const MarkdownPreviewLight = dynamic(
  () => import("@churchapps/apphelper").then((mod) => mod.MarkdownPreviewLight),
  { ssr: false }
);

export default function Localhost() {
  const [val, setVal] = useState("");

  return (
    <Container>
      <p>Select a site:</p>
      <Link href="http://crcc.localhost:3301">CRCC</Link>
      <br />
      <Link href="http://ironwood.localhost:3301">Ironwood</Link>
      <br />
      <Link href="http://ironwood.localhost:3301/my">My</Link>
      <br />
      <Link href="http://ironwood.localhost:3301/admin">Admin</Link>

      <table>
        <tbody>
          <tr>
            <td>Hello</td>
            <td>World</td>
          </tr>
        </tbody>
      </table>

      <br />
      <h3>Editor</h3>
      <MarkdownEditor value={val} onChange={(v) => setVal(v)} />
      <h3>Markdown</h3>
      <TextField multiline fullWidth value={val} />
      <h3>Preview</h3>
      <MarkdownPreviewLight value={val} />
    </Container>
  );
}
