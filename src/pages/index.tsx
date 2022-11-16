import { GetStaticProps } from "next";
import Link from "next/link";
import { Container } from "@mui/material";

export default function Home() {
  return (
    <Container>
      <p>Select a site:</p>
      <Link href="/crcc">CRCC</Link><br />
      <Link href="/ironwood">Ironwood</Link><br />
      <Link href="/livecs/home">LiveCS Home</Link><br /><br />
      <Link href="/admin">Admin</Link><br /><br />
    </Container>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 30,
  };
};
