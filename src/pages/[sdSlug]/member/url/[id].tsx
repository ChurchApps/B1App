import { useRouter } from "next/router";
import { Wrapper } from "@/components";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";
import React from "react";
import UserContext from "@/context/UserContext";

export default function Url(props: WrapperPageProps) {
  const router = useRouter();
  const urlId = router.query.id as string;

  const context = React.useContext(UserContext);
  const jwt = context.userChurch?.jwt;
  const churchId = context.userChurch?.church.id;

  const url = (urlId==="chums")
    ? "https://app.chums.org/login?jwt=" + jwt + "&churchId=" + churchId
    : props.config.tabs.filter((t) => t.id === urlId)[0].url;

  return (
    <Wrapper config={props.config}>
      <iframe title="content" className="full-frame" src={url} />
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

