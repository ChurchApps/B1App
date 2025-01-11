import { ConfigHelper, EnvironmentHelper } from "@/helpers";

import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ApiHelper, GroupInterface, GroupMemberInterface, EventInterface } from "@churchapps/apphelper";
import { Metadata } from "next";
import { Theme } from "@/components";
import { DefaultPageWrapper } from "../../[pageSlug]/components/DefaultPageWrapper";
import { Button, Container, Grid } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { GroupHero } from "../details/[groupId]/components/GroupHero";

type PageParams = Promise<{ sdSlug: string;  }>

const loadSharedData = (sdSlug: string) => {
  EnvironmentHelper.init();
  //const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all", "sdSlug=" + sdSlug]});
  //return result(sdSlug, );
  return loadData(sdSlug);
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { sdSlug } = await params;
  const props = await loadSharedData(sdSlug);
  return MetaHelper.getMetaData("Hello World" + " - " + props.config.church.name, "Hello World", props.config.appearance.ogImage);
}

const loadData = async (sdSlug: string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");

  return { config }
}


export default async function GroupPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params
  const { config } = await loadSharedData(sdSlug);
  
  const group: GroupInterface = {
    name: "Discipleship",
    meetingLocation: "Johnson House",
    meetingTime: "Tuesdays at 7:30 pm",
    photoUrl: "https://content.staging.churchapps.org/stockPhotos/4/baptize.png",
  }


  return (<>
    <Theme config={config} />
    <DefaultPageWrapper config={config} overlayContent={true} linkColor="light">
    <GroupHero group={group} />
    <div style={{paddingTop:30}}>
      <Container>
        <Grid container spacing={2}>
          <Grid item md={8} xs={12}>
            <p style={{fontSize:18}}>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec risus magna, tincidunt nec laoreet vel, suscipit at arcu. Integer nec pellentesque tortor, sit amet feugiat justo. Fusce et magna eu libero bibendum rutrum. Maecenas ut enim orci. Sed rutrum ex turpis, vel dapibus odio tincidunt quis. Sed viverra augue odio, a pulvinar nunc interdum tempor. Fusce dui est, fermentum vitae quam id, consequat vestibulum dui. Nam eu tincidunt tellus, a volutpat eros. Nullam efficitur nunc id sem pulvinar mattis. Donec metus dolor, tempor ac nisi ut, viverra commodo sem.</p>
            <div><b>Leaders:</b> Jeremy Zongker</div>
          </Grid>
          <Grid item md={4} xs={12}>
            <h2 style={{ padding: "20px 0px", margin: "0px" }}>Upcomming Events:</h2>
            <Grid container spacing={2}>
              <Grid item md={3} xs={12}>
                <div className="calbox" style={{ textAlign:"center", padding:5, lineHeight: "80px", borderRadius: "15%", fontWeight: "bold" }}>
                  <p style={{ lineHeight: "16px" }}>May</p>
                  <p style={{ lineHeight: "16px" }}>4</p>
                </div>
              </Grid>
              <Grid item md={9} xs={12}>
                <div style={{ textAlign:"left", lineHeight: "40px", paddingLeft: "5px" }}>
                  <div style={{ fontWeight: "bold" }}>Weekly Meeting</div>
                  <div style={{ fontStyle: "italic" }}>Looking forward to seeing you.</div>
                </div>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        <div style={{ margin: "40px 0px", textAlign: "center" }}>
          <Button style={{ fontWeight: "bold", fontSize: "26px" }}>Request to Join Group</Button>
        </div>
      </Container>
    </div>
    </DefaultPageWrapper>
  </>);
}
