import { GetStaticProps } from "next";

export default function Home() {
  return (<>
    <p>Select a site:</p>
    <a href="/crcc/">CRCC</a><br />
    <a href="/ironwood/">Ironwood</a>
  </>);
}

export const getStaticProps: GetStaticProps = async () => {

  return {
    props: {},
    revalidate: 30,
  };
};
