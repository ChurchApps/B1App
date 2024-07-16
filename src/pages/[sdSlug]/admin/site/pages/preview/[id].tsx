import {  ConfigHelper, GlobalStyleInterface, PageInterface, WrapperPageProps } from "@/helpers";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";
import React from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import { AdminSiteWrapper } from "@/components/admin/AdminSiteWrapper";

interface Props extends WrapperPageProps {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any,
  globalStyles: GlobalStyleInterface
};

export default function Preview(props: Props) {
  const isDev = false;
  const url = (isDev) ? "/" + props.church.subDomain + "/" + props.pageData.url : "/" + props.pageData.url;

  return <AdminSiteWrapper config={props.config}>
    <div style={{marginLeft:-22, marginTop:-30, marginRight:-22}}>
      <div style={{background:"#FFF", height:60, paddingTop:15}}>
      Edit Content
      </div>
      <iframe src={url} style={{width:"100%", height:"100vh"}} />
    </div>
  </AdminSiteWrapper>
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
  const pageData: PageInterface = await ApiHelper.getAnonymous("/pages/" + church.id + "/tree?id=" + params.id, "ContentApi");
  return { props: { config, churchSettings, globalStyles, pageData, church }, revalidate: 30 };
};
