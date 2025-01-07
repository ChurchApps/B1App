import { ChurchInterface } from "@churchapps/apphelper";
import { GlobalStyleInterface } from "@/helpers";
import "@/styles/animations.css";

import { Grid } from "@mui/material";

import Link from "next/link";
import { DefaultPageWrapper } from "@/app/[sdSlug]/[pageSlug]/components/DefaultPageWrapper";




interface Props {
  children: JSX.Element;
  churchSettings: any;
  church: ChurchInterface;
  navLinks: any;
  globalStyles: GlobalStyleInterface;
}

export async function MyWrapper(props:Props) {


  const getTabs = () => {
    const tabs: {url: string, label: string}[] = [];
    tabs.push({url:"/my/timeline", label:"Timeline"});
    tabs.push({url:"/my/groups", label:"Groups"});
    tabs.push({url:"/my/plans", label:"Plans"});
    return tabs;
  }

  const getItem = (tab:any) =>
    //if (tab.key === selectedTab) return (<li className="active"><a href="about:blank" onClick={(e) => { e.preventDefault(); setSelectedTab(tab.key); }}><Icon>{tab.icon}</Icon> {tab.label}</a></li>)
    (<li><Link href={tab.url}>{tab.label}</Link></li>)



  return (
    <DefaultPageWrapper churchSettings={props.churchSettings} church={props.church} navLinks={props.navLinks} globalStyles={props.globalStyles}>
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
            {props.children}
          </div>
        </Grid>
      </Grid>
    </DefaultPageWrapper>
  );
}
