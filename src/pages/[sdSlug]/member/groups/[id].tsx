import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { GroupInterface, ApiHelper, UserHelper } from "@/helpers";
import { Wrapper, MarkdownPreview, Conversations } from "@/components";
import UserContext from "@/context/UserContext";
import { GetStaticPaths, GetStaticProps } from "next";

export default function GroupPage(props: any) {
  const [group, setGroup] = useState<GroupInterface>(null);
  const router = useRouter();
  const context = useContext(UserContext);
  const { id: groupId } = router.query;

  const loadData = () => {
    ApiHelper.get("/groups/" + groupId, "MembershipApi").then((data) => setGroup(data));
  };

  useEffect(loadData, [groupId]);

  if (!UserHelper.currentUserChurch?.person?.id) {
    return (
      <Wrapper sdSlug={props.sdSlug}>
        <h1>Group</h1>
        <h3 className="text-center w-100">
          Please <Link href="/login/?returnUrl=/directory">Login</Link> to view your groups.
        </h3>
      </Wrapper>
    );
  }

  return (
    <Wrapper sdSlug={props.sdSlug}>
      {group ? (
        <>
          <h1>{group.name}</h1>
          {group.photoUrl && <img id="tabImage" src={group.photoUrl} alt={group.name} style={{ maxHeight: 300 }} />}
          <MarkdownPreview value={group.about} />
          <Conversations context={context} contentType="group" contentId={group.id} groupId={group.id} />
        </>
      ) : (
        <p>No group data found</p>
      )}
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
