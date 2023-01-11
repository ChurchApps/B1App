import { Wrapper } from "@/components";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Member(props: any) {
  return (
    <Wrapper sdSlug={props.sdSlug} >
      <h1>Member Portal</h1>
      <p>Select and option on the left</p>
    </Wrapper>
  );
}


export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  return {
    props: { sdSlug: params.sdSlug },
    revalidate: 30,
  };
};
