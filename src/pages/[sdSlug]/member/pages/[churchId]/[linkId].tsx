import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Wrapper, Theme } from "@/components";
import { EnvironmentHelper } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Pages(props: any) {
  const [content, setContent] = useState("");
  const router = useRouter();
  const { churchId, linkId } = router.query;

  useEffect(() => {
    const path = `${EnvironmentHelper.Common.ContentRoot}/${churchId}/pages/${linkId}.html?ts=${new Date()
      .getTime()
      .toString()}`;
    fetch(path)
      .then((response) => response.text())
      .then((c) => {
        setContent(c);
      });
  }, []);

  return (
    <Wrapper sdSlug={props.sdSlug}>
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
  return {
    props: { sdSlug: params.sdSlug },
    revalidate: 30,
  };
};
