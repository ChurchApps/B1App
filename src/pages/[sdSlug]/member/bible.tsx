import { Wrapper } from "@/components";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Bible(props: any) {
  return (
    <Wrapper sdSlug={props.sdSlug}>
      <iframe
        title="content"
        className="full-frame"
        src="https://biblia.com/api/plugins/embeddedbible?layout=normal&historyButtons=false&resourcePicker=false&shareButton=false&textSizeButton=false&startingReference=Ge1.1&resourceName=nirv"
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
