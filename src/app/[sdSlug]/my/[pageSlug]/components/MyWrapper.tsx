import { ChurchInterface } from "@churchapps/apphelper";
import { GlobalStyleInterface } from "@/helpers";
import "@/styles/animations.css";

import { Breadcrumbs, Container, Grid } from "@mui/material";

import Link from "next/link";
import { DefaultPageWrapper } from "@/app/[sdSlug]/[pageSlug]/components/DefaultPageWrapper";




interface Props {
  children: JSX.Element;
  churchSettings: any;
  church: ChurchInterface;
  navLinks: any;
  globalStyles: GlobalStyleInterface;
  root?: boolean;
  pageSlug?: string;
}

export async function MyWrapper(props:Props) {


  const getTabs = () => {
    const tabs: {url: string, label: string}[] = [];
    tabs.push({url:"/my/timeline", label:"Timeline"});
    tabs.push({url:"/my/groups", label:"Groups"});
    tabs.push({url:"/my/community", label:"Community"});
    tabs.push({url:"/my/plans", label:"Plans"});
    tabs.push({url:"/my/checkin", label:"Check-in"});
    tabs.push({url:"/my/lessons", label:"Lessons"});

    return tabs;
  }

  const getPageLink = (pageSlug:string) => {
    switch (pageSlug) {
      case "timeline": return {url: "/my/timeline", label: "Timeline"};
      case "groups": return {url: "/my/groups", label: "Groups"};
      case "community": return {url: "/my/community", label: "Community"};
      case "plans": return {url: "/my/plans", label: "Plans"};
      case "checkin": return {url: "/my/checkin", label: "Check-in"};
      case "lessons": return {url: "/my/lessons", label: "Lessons"};
      default: return {url: "/my/timeline", label: "Timeline"};
    }
  }

  const getItem = (tab:any) =>
    //if (tab.key === selectedTab) return (<li className="active"><a href="about:blank" onClick={(e) => { e.preventDefault(); setSelectedTab(tab.key); }}><Icon>{tab.icon}</Icon> {tab.label}</a></li>)
    (<li><Link href={tab.url}>{tab.label}</Link></li>)


  const getRootLayout = () => <Container>
    <div id="mainContent">
      <Grid container spacing={2}>
        <Grid item xs={12} md={2}>
          <div className="sideNav" style={{height:"100vh", borderRight:"1px solid #CCC" }}>
            <ul>
              {getTabs().map((tab, index) => getItem(tab))}
            </ul>
          </div>
        </Grid>
        <Grid item xs={12} md={10}>
          {props.children}
        </Grid>
      </Grid>
    </div>
  </Container>

  const getPageLabel = () => {
    const pageLink = getPageLink(props.pageSlug);
    return <span>{pageLink.label}</span>
  }

  const getChildLayout = () => <Container>
    <Breadcrumbs separator="›" aria-label="breadcrumb" style={{marginTop:30}}>
      <Link href="/my">My Ironwood Church</Link>
      <span>{getPageLabel()}</span>
    </Breadcrumbs>
    {props.children}

  </Container>

  return (
    <DefaultPageWrapper churchSettings={props.churchSettings} church={props.church} navLinks={props.navLinks} globalStyles={props.globalStyles}>
      {props.root && getRootLayout()}
      {!props.root && getChildLayout()}
    </DefaultPageWrapper>
  );
}
