import "@/styles/animations.css";

import { Breadcrumbs, Container, Grid } from "@mui/material";

import Link from "next/link";
import { DefaultPageWrapper } from "@/app/[sdSlug]/[pageSlug]/components/DefaultPageWrapper";
import { TabsClient } from "./TabsClient";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";

interface Props {
  children: JSX.Element;
  config: ConfigurationInterface;
  root?: boolean;
  pageSlug?: string;
  idLabel?: string;
}

export async function MyWrapper(props:Props) {

  const getPageLink = (pageSlug:string) => {
    switch (pageSlug) {
      case "timeline": return {url: "/my/timeline", label: "Timeline"};
      case "groups": return {url: "/my/groups", label: "Groups"};
      case "community": return {url: "/my/community", label: "Community"};
      case "plans": return {url: "/my/plans", label: "Plans"};
      case "checkin": return {url: "/my/checkin", label: "Check-in"};
      case "lessons": return {url: "/my/lessons", label: "Lessons"};
      case "donate": return {url: "/my/donate", label: "Donations"};
      default: return {url: "/my/timeline", label: "Timeline"};
    }
  }

  const getRootLayout = () => <Container>
    <div id="mainContent">
      <Grid container spacing={2}>
        <Grid item xs={12} md={2}>
          <div className="sideNav" style={{height:"100vh", borderRight:"1px solid #CCC" }}>
            <TabsClient config={props.config} />
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
    if (props.idLabel) return <Link href={pageLink.url}>{pageLink.label}</Link>
    else return <span>{pageLink.label}</span>
  }

  const getIdLabel = () => {
    if (props.idLabel) return <span>{props.idLabel}</span>
  }

  const getChildLayout = () => <Container>
    <Breadcrumbs separator="›" aria-label="breadcrumb" style={{marginTop:30, marginBottom:30}}>
      <Link href="/my/timeline">My {props.config?.church?.name}</Link>
      {getPageLabel()}
      {getIdLabel()}
    </Breadcrumbs>
    {props.children}

  </Container>

  return (
    <DefaultPageWrapper config={props.config}>
      {props.root && getRootLayout()}
      {!props.root && getChildLayout()}
    </DefaultPageWrapper>
  );
}
