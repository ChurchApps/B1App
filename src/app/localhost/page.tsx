"use client";
import Link from "next/link";
import { Container, TextField } from "@mui/material";
import { useState } from "react";

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
      <h3>Markdown Test (Editor temporarily disabled)</h3>
      <TextField multiline fullWidth value={val} onChange={(e) => setVal(e.target.value)} />
    </Container>
  );
}
