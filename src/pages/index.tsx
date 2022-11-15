import { GetStaticProps } from "next";
import Link from "next/link";

export default function Home() {
  return (<>
    <p>Select a site:</p>
    <Link href="http://crcc.localhost:3000/test">CRCC</Link><br />
    <Link href="http://ironwood.localhost:3000/test">Ironwood</Link>
  </>);
}

export const getStaticProps: GetStaticProps = async () => {

  return {
    props: {},
    revalidate: 30,
  };
};
