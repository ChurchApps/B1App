import {  ConfigHelper, GlobalStyleInterface, PageInterface, WrapperPageProps } from "@/helpers";
import { ApiHelper, ChurchInterface, LinkInterface, SmallButton } from "@churchapps/apphelper";
import React, { useEffect } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import { AdminSiteWrapper } from "@/components/admin/AdminSiteWrapper";
import { Grid } from "@mui/material";
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

interface Props extends WrapperPageProps {
  pageData: any;
  church: ChurchInterface,
  churchSettings: any,
  globalStyles: GlobalStyleInterface
};

export default function Preview(props: Props) {
  const url = props.pageData.url;
  const [showSettings, setShowSettings] = React.useState(false);
  const router = useRouter()
  const searchParams = useSearchParams()
  //const [link, setLink] = React.useState<LinkInterface>(null);

  const loadData = () => {
    //const linkId = searchParams.get("linkId");
    //if (linkId) ApiHelper.get("/links/" + linkId, "ContentApi").then(data => { setLink(data); });
  }

  const handlePageUpdated = (page: PageInterface, link:LinkInterface) => {
    setShowSettings(false);
    if (!page) router.push("/admin/site");
    else router.refresh();
  }

  console.log("URL: " + url);

  useEffect(loadData, [searchParams.get("linkId")]);

  //{showSettings && <PageLinkEdit link={link} page={props.pageData} updatedCallback={handlePageUpdated} onDone={() => setShowSettings(false)} />}
  return <AdminSiteWrapper config={props.config}>

    <div style={{marginLeft:-22, marginTop:-30, marginRight:-22}}>
      <div style={{background:"#FFF", padding:15}}>
        <Grid container>
          <Grid item xs={3}>
            <SmallButton icon="edit" text="Edit Content" onClick={() => { router.push("../" + props.pageData.id)}} />
          </Grid>
          <Grid item xs={6} style={{textAlign:"center"}}>
            <b>{props.pageData.title}</b><br />
          </Grid>
          <Grid item xs={3} style={{textAlign:"right"}}>
            <SmallButton icon="settings" text="Page Settings" onClick={() => setShowSettings(true)} />
          </Grid>
        </Grid>

      </div>
      <div>Url: {url}</div>
    </div>
  </AdminSiteWrapper>
}

//<iframe sandbox="allow-scripts" src={"https://ironwood.staging.b1.church" + url} style={{width:"100%", height:"100vh"}} />

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
