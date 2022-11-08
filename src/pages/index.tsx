import { GetStaticProps } from "next";
import Link from "next/link";

export default function Home() {
  return (<>
    <p>Select a site:</p>
    <Link href="/crcc/"><a>CRCC</a></Link>
    <Link href="/ironwood/"><a>Ironwood</a></Link>
  </>);
}

export const getStaticProps: GetStaticProps = async () => {

  return {
    props: {},
    revalidate: 30,
  };
};
