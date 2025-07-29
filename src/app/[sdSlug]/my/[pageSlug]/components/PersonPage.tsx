"use client";

import Link from "next/link";
import { Person } from "@/components/member/directory/Person";
import { UserHelper } from "@churchapps/apphelper";

interface Props {
  personId: string;
}

export function PersonPage(props: Props) {
  const { personId } = props;

  // Validate personId
  if (!personId || personId === 'undefined' || personId.trim() === '') {
    return (
      <>
        <h1>Invalid Person</h1>
        <p>The person ID is invalid or missing.</p>
        <Link href="/my/community">Return to Directory</Link>
      </>
    );
  }

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
            <h3 className="text-center w-100">Please{" "} <Link href={`/login/?returnUrl=/my/community/${personId}`}>Login</Link>{" "} to view Directory.</h3>
          </>
        )}
    </>
  );
}
