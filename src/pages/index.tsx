import Link from "next/link";
import { Container } from "@mui/material";
import { Wrapper } from "@/components/Wrapper";

export default function Home() {
  return (
    <Wrapper>
      <Container>
        <p>Select a site:</p>
        <Link href="/crcc">CRCC</Link>
        <br />
        <Link href="/ironwood">Ironwood</Link>
        <br />
        <Link href="/livecs/home">LiveCS Home</Link>
        <br />
        <br />
        <Link href="/ironwood/admin">Admin</Link>
        <br />
        <br />
      </Container>
    </Wrapper>
  );
}
