import { GetStaticProps } from "next";
import Link from "next/link";
import { YoutubeBackground } from "components/YoutubeBackground";
import { Container } from "@mui/material";

export default function Home() {
  return (
    <YoutubeBackground videoId="3iXYciBTQ0c" overlay="rgba(0,0,0,.4)">
      <Container>
        <p>Select a site:</p>
        <Link href="http://crcc.localhost:3000/test">CRCC</Link><br />
        <Link href="http://crcc.localhost:3000/test">Ironwood</Link><br />
      </Container>
    </YoutubeBackground>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
    revalidate: 30,
  };
};
