import { useEffect } from "react";
import { YourSiteSettings } from "@/components";
import { GetStaticPaths, GetStaticProps } from "next";
import router from "next/router";
import { ConfigHelper, WrapperPageProps } from "@/helpers";
import { ApiHelper } from "@churchapps/apphelper";
import { AdminWrapper } from "@/components/admin/AdminWrapper";

export default function Admin(props: WrapperPageProps) {
  const { isAuthenticated } = ApiHelper;
  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, []);

  return (
    <AdminWrapper config={props.config}>
      <h1>Manage Your Site</h1>
      <YourSiteSettings />
    </AdminWrapper>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  return { props: { config }, revalidate: 30 };
};
