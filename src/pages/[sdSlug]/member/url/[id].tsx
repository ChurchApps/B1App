import { useRouter } from "next/router";
import { Wrapper } from "@/components";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Url(props: WrapperPageProps) {
  const router = useRouter();
  const urlId = router.query.id as string;

  const linkObject = props.config.tabs.filter((t) => t.id === urlId)[0];

  return (
    <Wrapper config={props.config}>
      <iframe title="content" className="full-frame" src={linkObject.url} />
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

