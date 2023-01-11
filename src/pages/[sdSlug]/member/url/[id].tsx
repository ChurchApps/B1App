import { useRouter } from "next/router";
import { Wrapper } from "@/components";
import { ConfigHelper } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Url(props: any) {
  const router = useRouter();
  const urlId = router.query.id as string;

  const linkObject = ConfigHelper.current.tabs.filter((t) => t.id === urlId)[0];

  return (
    <Wrapper sdSlug={props.sdSlug}>
      <iframe title="content" className="full-frame" src={linkObject.url} />
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

