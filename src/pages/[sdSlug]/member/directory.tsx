import React from "react";
import Link from "next/link";
import { UserHelper } from "@/helpers";
import { DirectorySearch } from "@/components/member/directory/DirectorySearch";
import { Person } from "@/components/member/directory/Person";
import { Wrapper } from "@/components/Wrapper";
import { GetStaticPaths, GetStaticProps } from "next";

export default function Admin(props: any) {

  const [personId, setPersonId] = React.useState("");

  const handlePersonSelected = (personId: string) => { setPersonId(personId); }
  const handleBack = () => { setPersonId(""); }

  const getContent = () => personId ? <Person personId={personId} backHandler={handleBack} selectedHandler={handlePersonSelected} /> : <DirectorySearch selectedHandler={handlePersonSelected} />

  return (

    <Wrapper sdSlug={props.sdSlug}>
      {
        UserHelper.user?.firstName
          ? (getContent())
          : <><h1>Member Directory</h1><h3 className="text-center w-100">Please <Link href="/login/?returnUrl=/member/directory">Login</Link> to view Directory.</h3></>
      }
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

