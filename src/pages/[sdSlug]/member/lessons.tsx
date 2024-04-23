import { Wrapper } from "@/components";
import UserContext from "@/context/UserContext";
import { EnvironmentHelper, ConfigHelper, WrapperPageProps } from "@/helpers";
import { GetStaticPaths, GetStaticProps } from "next";
import React from "react";

export default function Lessons(props: WrapperPageProps) {
  const context = React.useContext(UserContext);
  const jwt = context.userChurch?.jwt;
  const churchId = context.userChurch?.church.id;

  return (
    <Wrapper config={props.config}>
      <div style={{paddingLeft:10}}>
        <iframe
          title="content"
          className="full-frame"
          src={EnvironmentHelper.Common.LessonsRoot + "/login?jwt=" + jwt + "&returnUrl=/b1/person&churchId=" + churchId }
        />
      </div>
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
