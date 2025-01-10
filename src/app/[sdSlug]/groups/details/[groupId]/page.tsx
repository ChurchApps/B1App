import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { DefaultPageWrapper } from "../../../[pageSlug]/components/DefaultPageWrapper";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { MetaHelper } from "@/helpers/MetaHelper";
import { ApiHelper, GroupInterface, GroupMemberInterface, EventInterface } from "@churchapps/apphelper";
import { Metadata } from "next";
import { Button } from "@mui/material";
import { Theme } from "@/components";

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
  return MetaHelper.getMetaData("Hello World" + " - " + props.config.church.name, "Hello World", props.config.appearance.ogImage);
}

const loadData = async (sdSlug: string, groupId: string) => {
  const config: ConfigurationInterface = await ConfigHelper.load(sdSlug, "website");
  const mainData: GroupInterface = await ApiHelper.get("/groups/public/" + config.church.id + "/" + groupId, "MembershipApi");
  const events: EventInterface[] = await ApiHelper.get("/events/public/group/" + config.church.id + "/" + groupId, "ContentApi");
  const leaders: GroupMemberInterface[] = await ApiHelper.get("/groupMembers/public/leaders/" + config.church.id + "/" + groupId, "MembershipApi");

  // console.log("Events:", events);
  // console.log("Leaders:", leaders);

  return { config, mainData, events, leaders }
}

/* RESOLVED, here for temporary example:
 const loadMoreData = () => {
    const mainData: any = ApiHelper.get("/groups/public/:churchId/:groupId", "MembershipApi");
    console.log(mainData);
    return { mainData }
}
    RESOLVED */

/* FOREACH EXAMPLE:
const getFundArray = () => {
    const result: any[] = [];
    fundDonations.forEach((fd) => {
      const fund = ArrayHelper.getOne(funds, "id", fd.fundId);
      const donation = ArrayHelper.getOne(donations, "id", fd.donationId);
      if (donation) {

        result.push({ fund: fund?.name, amount: fd.amount });
      }
    });
    return result;
  }
 END EXAMPLE */

export default async function GroupPage({ params }: { params: PageParams }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug, groupId } = await params
  const { mainData, events, leaders, config } = await loadSharedData(sdSlug, groupId);

  const getLeaders = () => {
    const result: JSX.Element[] = [];
    leaders.forEach((l) => {
      // console.log("name:", l.person.name.display, "photo:", l.person.photo);
      // console.log("photo:", l.person.photo ? l.person.photo : "public/images/sample-profile.png");
      result.push(<div style={{ display: "flex", width: "20%", height: "30px", backgroundColor: "hsl(0, 0%, 85%)", marginLeft: "5px" }}>
        <div style={{ width: "30%", lineHeight: "30px" }}>
          <img src={l.person.photo ? l.person.photo : "public/images/sample-profile.png"} />
        </div>
        <div style={{ width: "70%", lineHeight: "30px" }}>{l.person.name.display}</div>
      </div>);
      // console.log("RESULT:", result);
    });
    return result;
  }

  const getEvents = () => {
    const result: JSX.Element[] = [];
    const currDate = new Date();

    events.forEach((e) => {
      // console.log("name:", e.title, "desc:", e.description, e.start);
      const startDate = new Date(e.start);
      const monthAbb = startDate.toLocaleString('en-US', { month: 'short' });

      if (result.length < 3 && startDate > currDate) {
        // console.log("start date:", startDate);
        result.push(<div style={{ display: "flex" }}>
          <div style={{ display: "flex", width: "40%", height: "80px", marginBottom: "5px" }}>
            <div style={{ width: "70%" }}></div>
            <div className="calbox" style={{ width: "30%", lineHeight: "80px", borderRadius: "15%", fontWeight: "bold" }}>
              <p style={{ lineHeight: "16px" }}>{monthAbb}</p>
              <p style={{ lineHeight: "16px" }}>{startDate.getDay().toString()}</p>
            </div>
          </div>
          <div style={{ width: "60%", textAlign: "left", lineHeight: "40px", paddingLeft: "5px" }}>
            <div style={{ fontWeight: "bold" }}>{e.title}</div>
            <div style={{ fontStyle: "italic" }}>{e.description}</div>
          </div>
        </div>)
      } else if (result.length === 0) {
        result.push(<div style={{ fontStyle: "italic", height: "80px", lineHeight: "80px", fontSize: "18px" }}>No upcoming events found for selected group.</div>);
      }
    });
    return result;
  }

  return (<>
    <Theme appearance={config.appearance} globalStyles={config.globalStyles} config={config} />
    <DefaultPageWrapper churchSettings={config.appearance} church={config.church} navLinks={config.navLinks} globalStyles={config.globalStyles}>
      <div style={{ textAlign: "center", marginBottom: "5px" }}><img src={mainData.photoUrl} /></div>
      <div style={{ display: "flex" }}>
        <div style={{ textAlign: "center", width: "60%" }}>
          <h1 id="gpn" style={{ padding: "20px 0px", margin: "0px" }}>{mainData.name}</h1>
          <p style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>About Us: </span>{mainData.about}</p>

          <div style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left", display: "flex" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Leader(s): </span>
            {getLeaders()}
          </div>

          <p style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Schedule: </span>{mainData.meetingTime}</p>
          <p style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Located: </span>{mainData.meetingLocation}</p>
        </div>
        {/* CALENDAR */}
        <div style={{ textAlign: "center", width: "40%" }}>
          <h2 style={{ padding: "20px 0px", margin: "0px" }}>Calendar Events:</h2>
          {getEvents()}
        </div>
        {/* CALENDAR END */}
      </div>
      <div style={{ margin: "40px 0px", textAlign: "center" }}>
        <Button style={{ fontWeight: "bold", fontSize: "26px" }}>Request to Join Group</Button>
      </div>
    </DefaultPageWrapper>
  </>);
}
