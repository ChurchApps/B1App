import { PageLayout, Theme } from "@/components";
import { ApiHelper, ChurchInterface } from "@churchapps/apphelper";
import { ConfigHelper, EnvironmentHelper, GlobalStyleInterface, PageInterface } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { Metadata } from "next";
import "@/styles/animations.css";
import { Animate } from "@/components/Animate";

import { notFound } from "next/navigation";
import { DefaultPageWrapper } from "../../[pageSlug]/components/DefaultPageWrapper";
import { Grid } from "@mui/material";
import { TimelinePage } from "./components/TimelinePage";


type PageParams = Promise<{ sdSlug: string;  pageSlug: string; }>

const loadSharedData = (sdSlug:string, pageSlug:string) => {
  EnvironmentHelper.init();
  //const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all", "sdSlug=" + sdSlug]});
  //return result(sdSlug, pageSlug);
  return loadData(sdSlug, pageSlug);
}

export async function generateMetadata({params}: {params:PageParams}): Promise<Metadata> {
  const { sdSlug, pageSlug } =  await params;
  const props = await loadSharedData(sdSlug, pageSlug);

  const title = "My....";
  return MetaHelper.getMetaData(title + " - " + props.church.name, "My", props.churchSettings.ogImage);
}

const loadData = async (sdSlug:string, pageSlug:string) => {

  const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
  const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
  const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
  const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
  const config: ConfigurationInterface = await ConfigHelper.load(church.subDomain);

  return { church, churchSettings, navLinks, globalStyles, config }
}

export default async function Home({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, pageSlug } = await params;
  const { church, churchSettings, globalStyles, navLinks, config } = await loadSharedData(sdSlug, pageSlug);

  const getPageContent = () => {
    console.log("Page Slug", pageSlug);
    
    switch (pageSlug)
    {
      default: return wrapDefaultPage(<TimelinePage />);
      //default: return notFound();
    }
    
  }

  let defaultTab = "details";

  const getTabs = () => {
    const tabs: {key: string, icon: string, label: string}[] = [];
    tabs.push({key:"details", icon:"person", label:"First Tab"});
    return tabs;
  }

  const getItem = (tab:any) => {
    //if (tab.key === selectedTab) return (<li className="active"><a href="about:blank" onClick={(e) => { e.preventDefault(); setSelectedTab(tab.key); }}><Icon>{tab.icon}</Icon> {tab.label}</a></li>)
    //return (<li><a href="about:blank" onClick={(e) => { e.preventDefault(); setSelectedTab(tab.key); }}><Icon>{tab.icon}</Icon> {tab.label}</a></li>)
    return (<li><a href="">Test</a></li>)
  }

  const wrapDefaultPage = (content:JSX.Element) => <DefaultPageWrapper churchSettings={churchSettings} church={church} navLinks={navLinks} globalStyles={globalStyles}>
    <Grid container spacing={2}>
      <Grid item xs={12} md={2}>
        <div className="sideNav" style={{height:"100vh", borderRight:"1px solid #CCC" }}>
          <ul>
            {getTabs().map((tab, index) => getItem(tab))}
          </ul>
        </div>
      </Grid>
      <Grid item xs={12} md={10}>
        <div id="mainContent">
          {content}
        </div>
      </Grid>
    </Grid>
  </DefaultPageWrapper>

  return (
    <>
      <Theme appearance={churchSettings} globalStyles={globalStyles} config={config} />
      
     

          {getPageContent()}
        
      <Animate />
    </>
  );
}
