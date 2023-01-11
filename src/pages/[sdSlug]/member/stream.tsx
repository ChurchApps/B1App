import { EnvironmentHelper, ConfigHelper } from "@/helpers";
import { Wrapper } from "@/components";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Stream(props: any) {
  return (
    <Wrapper sdSlug={props.sdSlug}>
      <iframe
        title="content"
        className="full-frame"
        src={EnvironmentHelper.Common.StreamingLiveRoot.replace("{key}", ConfigHelper.current.church.subDomain)}
      />
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
