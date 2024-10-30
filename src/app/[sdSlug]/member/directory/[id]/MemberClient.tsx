"use client";

import Link from "next/link";
import { Person } from "@/components/member/directory/Person";
import { WrapperPageProps } from "@/helpers";
import { UserHelper } from "@churchapps/apphelper";

interface Props extends WrapperPageProps {
  personId: string;
}

export function MemberClient(props: Props) {
  const { personId } = props;

  const getContent = () => (
    <Person personId={personId} backHandler={() => {}} selectedHandler={() => {}} />
  );

  return (
    <>
      {UserHelper.user?.firstName
        ? ( getContent() )
        : (
          <>
            <h1>Member Directory</h1>
            <h3 className="text-center w-100">Please{" "} <Link href={`/login/?returnUrl=/member/directory/${personId}`}>Login</Link>{" "} to view Directory.</h3>
          </>
        )}
    </>
  );
}
