import { ConfigHelper } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function DonationLanding(props: any) {
  return (<>
    <h1>Subdomain test</h1>
    <p>Server side answer is: {props.sdSlug}</p>
    <h2>Config</h2>
    {JSON.stringify(props.config)}
  </>)
}

export const getStaticPaths: GetStaticPaths = async () => {

  const paths = [];

  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return {
    props: { sdSlug: params.sdSlug, config },
    revalidate: 30,
  };
};
