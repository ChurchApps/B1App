import { EnvironmentHelper, ConfigHelper, WrapperPageProps } from "@/helpers";
import { Wrapper } from "@/components";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Stream(props: WrapperPageProps) {
  return (
    <Wrapper config={props.config}>
      <iframe
        title="content"
        className="full-frame"
        src={EnvironmentHelper.Common.B1Root.replace("{key}", props.config.church.subDomain) + "/stream?hideHeader=1"}
      />
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
