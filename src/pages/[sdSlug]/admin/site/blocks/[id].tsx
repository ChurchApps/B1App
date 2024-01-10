import { useRouter } from "next/router";
import { ConfigHelper, WrapperPageProps, GlobalStyleInterface } from "@/helpers";
import { UserHelper, ChurchInterface, ApiHelper } from "@churchapps/apphelper";
import React from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import ContentEditor from "@/components/admin/ContentEditor/ContentEditor";

interface Props extends WrapperPageProps {
  church: ChurchInterface,
  churchSettings: any,
  globalStyles: GlobalStyleInterface
};

export default function Admin(props: Props) {
  const router = useRouter();
  const id = router.query.id?.toString() || "";
  const loadData = async (id:string) => await ApiHelper.get("/blocks/" + UserHelper.currentUserChurch.church.id + "/tree/" + id, "ContentApi")
  return <ContentEditor loadData={loadData} church={props.church} churchSettings={props.churchSettings} globalStyles={props.globalStyles} blockId={id} config={props.config}  />

}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths:any[] = [];
  return { paths, fallback: "blocking", };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const config = await ConfigHelper.load(params.sdSlug.toString());
  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + params.sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  return { props: { config, churchSettings, globalStyles }, revalidate: 30 };
};
