import Link from "next/link";
import { useRouter } from "next/router";
import { GetStaticPaths, GetStaticProps } from "next";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { Wrapper } from "@/components/Wrapper";
import { Person } from "@/components/member/directory/Person";
import { UserHelper } from "@churchapps/apphelper";

export default function MemberPage(props: WrapperPageProps) {
  const router = useRouter();
  const { id: personId } = router.query;

  const getContent = () => (
    <Person
      personId={personId as string}
      backHandler={() => {}}
      selectedHandler={() => {}}
    />
  );

  return (
    <Wrapper config={props.config}>
      {UserHelper.user?.firstName
        ? (
          getContent()
        )
        : (
          <>
            <h1>Member Directory</h1>
            <h3 className="text-center w-100">
            Please{" "}
              <Link href={"/login/?returnUrl=/member/directory/" + personId}>
              Login
              </Link>{" "}
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
