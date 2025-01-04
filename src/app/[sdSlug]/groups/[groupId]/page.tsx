import { ConfigHelper, EnvironmentHelper, GlobalStyleInterface, PageInterface } from "@/helpers";
import { DefaultPageWrapper } from "../../[pageSlug]/components/DefaultPageWrapper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ChurchInterface, ApiHelper, GroupInterface } from "@churchapps/apphelper";
import { Metadata } from "next";
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
    const events: GroupInterface = await ApiHelper.get("/events/public/group/" + church.id + "/" + groupId, "ContentApi");
    const leaders: GroupInterface = await ApiHelper.get("/groupMembers/public/leaders/" + church.id + "/" + groupId, "MembershipApi");

    const config: ConfigurationInterface = await ConfigHelper.load(church.subDomain);

    console.log("Events:", events);
    console.log("Leaders:", leaders);

    return { church, churchSettings, navLinks, globalStyles, config, mainData, events, leaders }
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
    const { church, churchSettings, globalStyles, navLinks, mainData, events, leaders } = await loadSharedData(sdSlug, groupId);

    return (
        <DefaultPageWrapper churchSettings={churchSettings} church={church} navLinks={navLinks} globalStyles={globalStyles}>
            <div style={{ textAlign: "center", marginBottom: "5px" }}><img src={mainData.photoUrl} /></div>
            <div style={{ display: "flex" }}>
                <div style={{ textAlign: "center", width: "60%" }}>
                    <h1 id="gpn" style={{ padding: "20px 0px", margin: "0px" }}>{mainData.name}</h1>
                    <p style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>About Us: </span>{mainData.about}</p>

                    <div style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left", display: "flex" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Leaders: </span>
                        <div style={{ display: "flex", width: "20%", height: "30px", backgroundColor: "hsl(0, 0%, 85%)", marginLeft: "5px" }}>
                            <div style={{ width: "30%", lineHeight: "30px" }}>Photo</div>
                            <div style={{ width: "70%", lineHeight: "30px" }}>Leader Name</div>
                        </div>
                    </div>

                    <p style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Schedule: </span>Consistent Time?</p>
                    <p style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Located: </span>Online/Campus</p>
                </div>
                {/* CALENDAR */}
                <div style={{ textAlign: "center", width: "40%" }}>
                    <h2 style={{ padding: "20px 0px", margin: "0px" }}>Calendar Events:</h2>
                    <div style={{ display: "flex" }}>
                        <div style={{ display: "flex", width: "40%", height: "80px", marginBottom: "5px" }}>
                            <div style={{ width: "70%" }}></div>
                            <div style={{ backgroundColor: "hsl(0, 0%, 85%)", width: "30%", lineHeight: "80px" }}>
                                <p style={{ lineHeight: "16px" }}>Month</p>
                                <p style={{ lineHeight: "16px" }}>Day</p>
                            </div>
                        </div>
                        <div style={{ width: "60%", textAlign: "left", lineHeight: "80px", paddingLeft: "5px" }}>Calendar Event 1</div>
                    </div>
                    <div style={{ display: "flex" }}>
                        <div style={{ display: "flex", width: "40%", height: "80px", marginBottom: "5px" }}>
                            <div style={{ width: "70%" }}></div>
                            <div style={{ backgroundColor: "hsl(0, 0%, 85%)", width: "30%" }}>
                                <p style={{ lineHeight: "16px" }}>Month</p>
                                <p style={{ lineHeight: "16px" }}>Day</p>
                            </div>
                        </div>
                        <div style={{ width: "60%", textAlign: "left", lineHeight: "80px", paddingLeft: "5px" }}>Calendar Event 2</div>
                    </div>
                    <div style={{ display: "flex" }}>
                        <div style={{ display: "flex", width: "40%", height: "80px", marginBottom: "5px" }}>
                            <div style={{ width: "70%" }}></div>
                            <div style={{ backgroundColor: "hsl(0, 0%, 85%)", width: "30%", lineHeight: "80px" }}>
                                <p style={{ lineHeight: "16px" }}>Month</p>
                                <p style={{ lineHeight: "16px" }}>Day</p>
                            </div>
                        </div>
                        <div style={{ width: "60%", textAlign: "left", lineHeight: "80px", paddingLeft: "5px" }}>Calendar Event 3</div>
                    </div>
                </div>
                {/* CALENDAR END */}
            </div>
            <div style={{ margin: "40px 0px", textAlign: "center" }}>
                <Button style={{ fontWeight: "bold", fontSize: "26px" }}>Request to Join Group</Button>
            </div>
        </DefaultPageWrapper>
    );
}
