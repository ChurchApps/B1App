import { GetStaticProps } from "next";
import Link from "next/link";

export default function Home() {
  return (<>
    <p>Select a site:</p>
    <Link href="/crcc/">CRCC</Link>
    <Link href="/ironwood/">Ironwood</Link>
  </>);
}

export const getStaticProps: GetStaticProps = async () => {

  return {
    props: {},
    revalidate: 30,
  };
};
