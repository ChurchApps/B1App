import { ConfigHelper, EnvironmentHelper, GlobalStyleInterface, PageInterface } from "@/helpers";
import { DefaultPageWrapper } from "../../[pageSlug]/components/DefaultPageWrapper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ChurchInterface, ApiHelper, GroupInterface } from "@churchapps/apphelper";
import { Metadata } from "next";
import { useState } from "react";
import { Button } from "@mui/material";

type PageParams = Promise<{ sdSlug: string; groupId: string; }>

const loadSharedData = (sdSlug: string, groupId: string) => {
    EnvironmentHelper.init();
    //const result = unstable_cache(loadData, ["/[sdSlug]", sdSlug], {tags:["all", "sdSlug=" + sdSlug]});
    //return result(sdSlug, );
    return loadData(sdSlug, groupId);
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
    const { sdSlug, groupId } = await params;
    const props = await loadSharedData(sdSlug, groupId);
    return MetaHelper.getMetaData("Hello World" + " - " + props.church.name, "Hello World", props.churchSettings.ogImage);
}

const loadData = async (sdSlug: string, groupId: string) => {

    const church: ChurchInterface = await ApiHelper.getAnonymous("/churches/lookup?subDomain=" + sdSlug, "MembershipApi");
    const churchSettings: any = await ApiHelper.getAnonymous("/settings/public/" + church.id, "MembershipApi");
    const globalStyles: GlobalStyleInterface = await ApiHelper.getAnonymous("/globalStyles/church/" + church.id, "ContentApi");
    const navLinks: any = await ApiHelper.getAnonymous("/links/church/" + church.id + "?category=website", "ContentApi");
    const mainData: GroupInterface = await ApiHelper.get("/groups/public/" + church.id + "/" + groupId, "MembershipApi");

    const config: ConfigurationInterface = await ConfigHelper.load(church.subDomain);

    return { church, churchSettings, navLinks, globalStyles, config, mainData }
}

/* RESOLVED, here for temporary example:
 const loadMoreData = () => {
    const mainData: any = ApiHelper.get("/groups/public/:churchId/:groupId", "MembershipApi");
    console.log(mainData);
    return { mainData }
} 
    RESOLVED */

export default async function GroupPage({ params }: { params: PageParams }) {
    await EnvironmentHelper.initServerSide();
    const { sdSlug, groupId } = await params
    const { church, churchSettings, globalStyles, navLinks, mainData } = await loadSharedData(sdSlug, groupId);

    return (
        <DefaultPageWrapper churchSettings={churchSettings} church={church} navLinks={navLinks} globalStyles={globalStyles}>
            <h1 style={{ textAlign: "center" }}>{mainData.name}</h1>
            <div style={{ display: "flex", margin: "40px 0px" }}>
                <div style={{ textAlign: "center", width: "50%" }}>Group Photo Here</div>
                <div style={{ textAlign: "center", width: "50%" }}>Group Description Here</div>
            </div>
            <div style={{ textAlign: "center", margin: "40px 0px" }}>
                <h2>Calendar Events:</h2>
                <div style={{ display: "flex" }}>
                    <div style={{ width: "33%" }}>Calendar Event 1</div>
                    <div style={{ width: "33%" }}>Calendar Event 2</div>
                    <div style={{ width: "33%" }}>Calendar Event 3</div>
                </div>
            </div>
            <div style={{ textAlign: "center" }}>
                <Button>Request to Join</Button>
            </div>
        </DefaultPageWrapper>
    );
}
