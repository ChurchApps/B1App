import { Login } from "@/components";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Logout(props: WrapperPageProps) {
  return (
    <Login keyName={props.config.keyName} />
  );
}


export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};