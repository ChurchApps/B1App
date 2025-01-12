"use client";

import { EnvironmentHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { EventInterface, GroupInterface, GroupMemberInterface } from "@churchapps/apphelper";
import { GroupContact } from "./GroupContact";

interface Props {
  config: ConfigurationInterface
  group: GroupInterface;
  events: EventInterface[];
  leaders: GroupMemberInterface[];
}

export function UnauthenticatedView(props: Props) {

  EnvironmentHelper.init();
  const getLeaders = () => {
    const result: JSX.Element[] = [];
    props.leaders.forEach((l) => {
      // console.log("name:", l.person.name.display, "photo:", l.person.photo);
      // console.log("photo:", l.person.photo ? l.person.photo : "public/images/sample-profile.png");
      result.push(<div key={l.person.id} style={{ display: "flex", width: "20%", height: "30px", backgroundColor: "hsl(0, 0%, 85%)", marginLeft: "5px" }}>
        <div style={{ width: "30%", lineHeight: "30px" }}>
          <img src={l.person.photo ? EnvironmentHelper.Common.ContentRoot + l.person.photo : EnvironmentHelper.Common.ContentRoot + "/public/images/sample-profile.png"} />
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

    props.events.forEach((e) => {
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
      } else {
        return result;
      }
    });
    if (result.length === 0) {
      result.push(<div style={{ fontStyle: "italic", height: "80px", lineHeight: "80px", fontSize: "18px" }}>No upcoming events found for selected group.</div>);
    } else {
      return result;
    }
    return result;
  }

  return <>
    <div style={{ textAlign: "center", marginBottom: "5px" }}><img src={props.group.photoUrl} /></div>
    <div style={{ display: "flex" }}>
      <div style={{ textAlign: "center", width: "60%" }}>
        <h1 id="gpn" style={{ padding: "20px 0px", margin: "0px" }}>{props.group.name}</h1>
        <p style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>About Us: </span>{props.group.about}</p>

        <div style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left", display: "flex" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Leader(s): </span>
          {getLeaders()}
        </div>

        <p style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Schedule: </span>{props.group.meetingTime}</p>
        <p style={{ padding: "0px 20px", fontSize: "18px", textAlign: "left" }}><span style={{ fontWeight: "bold", fontSize: "22px" }}>Located: </span>{props.group.meetingLocation}</p>
      </div>

      <div style={{ textAlign: "center", width: "40%" }}>
        <h2 style={{ padding: "20px 0px", margin: "0px" }}>Calendar Events:</h2>
        {getEvents()}
      </div>

    </div>
    <GroupContact group={props.group} leaders={props.leaders} config={props.config} />

  </>


}
