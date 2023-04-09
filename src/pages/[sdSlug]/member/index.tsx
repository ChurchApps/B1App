import { Wrapper } from "@/components";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Member(props: WrapperPageProps) {
  return (
    <Wrapper config={props.config}>
      <h1>Member Portal</h1>
      <p>Select and option on the left</p>
    </Wrapper>
  );
}


export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
