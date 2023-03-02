import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Wrapper, Theme } from "@/components";
import { ConfigHelper, EnvironmentHelper, WrapperPageProps } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Pages(props: WrapperPageProps) {
  const [content, setContent] = useState("");
  const router = useRouter();
  const { churchId, linkId, url } = router.query;

  useEffect(() => {
    if (!url) {
      const path = `${EnvironmentHelper.Common.ContentRoot}/${churchId}/pages/${linkId}.html?ts=${new Date().getTime().toString()}`;

      fetch(path)
        .then((response) => response.text())
        .then((c) => { setContent(c); });
    }
  }, []);

  if (url) return (<Wrapper config={props.config}>
    <div className="b1Frame">
      <iframe src={url.toString()} frameBorder="0"  />
    </div>
  </Wrapper>);
  else return (
    <Wrapper config={props.config}>
      <div style={{ backgroundColor: "#FFF", height: "100vh" }}>
        <Theme />
        <div dangerouslySetInnerHTML={{ __html: content }} style={{ padding: 5 }} />
      </div>
      );
    </Wrapper>
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
