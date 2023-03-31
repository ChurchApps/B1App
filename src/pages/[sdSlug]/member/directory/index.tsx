import React from "react";
import Link from "next/link";
import { ConfigHelper, UserHelper, WrapperPageProps } from "@/helpers";
import { DirectorySearch } from "@/components/member/directory/DirectorySearch";
import { Wrapper } from "@/components/Wrapper";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Admin(props: WrapperPageProps) {
  const getContent = () => <DirectorySearch selectedHandler={() => {}} />;

  return (
    <Wrapper config={props.config}>
      {UserHelper.user?.firstName
        ? (getContent())
        : (
          <>
            <h1>Member Directory</h1>
            <h3 className="text-center w-100">
            Please <Link href="/login/?returnUrl=/member/directory">Login</Link>{" "}
            to view Directory.
            </h3>
          </>
        )}
    </Wrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
