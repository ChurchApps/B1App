import { Wrapper } from "@/components";
import { EnvironmentHelper, ConfigHelper } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Lessons(props: any) {
  return (
    <Wrapper sdSlug={props.sdSlug}>
      <iframe
        title="content"
        className="full-frame"
        src={EnvironmentHelper.Common.LessonsRoot + "/b1/" + ConfigHelper.current.church.id}
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
