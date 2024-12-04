"use client"
import { useState, useEffect } from "react";
import { Button, Icon, Grid, Box } from "@mui/material";
import { CheckinHelper } from "@/helpers";
import { Groups } from "./Groups";
import { VisitInterface, GroupInterface, PersonInterface, ArrayHelper, ServiceTimeInterface, VisitSessionInterface, ApiHelper, Loading, PersonHelper } from "@churchapps/apphelper";

interface Props {
  completeHandler: () => void;
}

export function Household({ completeHandler = () => { } }: Props) {
  const [showGroups, setShowGroups] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingVisits, setPendingVisits] = useState<VisitInterface[]>(null);
  const [selectedMember, setSelectedMember] = useState<PersonInterface>(null);

  const handleGroupSelected = (group: GroupInterface) => {
    const groupId = group ? group.id : "";
    const groupName = group ? group.name : "None";

    let visit: VisitInterface = CheckinHelper.getVisitByPersonId(CheckinHelper.pendingVisits, selectedMember.id);
    if (visit === null) {
      visit = {
        personId: selectedMember.id,
        serviceId: CheckinHelper.selectedServiceTime.serviceId,
        visitSessions: [],
      };
      CheckinHelper.pendingVisits.push(visit);
    }
    const vs = visit?.visitSessions || [];
    CheckinHelper.setGroup(vs, CheckinHelper.selectedServiceTime.id, groupId, groupName);
    setPendingVisits(CheckinHelper.pendingVisits);
    setShowGroups(false);
  };

  const getServiceTime = (st: ServiceTimeInterface, visitSessions: VisitSessionInterface[]) => {
    const stSessions = ArrayHelper.getAll(visitSessions, "session.serviceTimeId", st.id);
    let selectedGroupName = "NONE";
    if (stSessions.length > 0) {
      const groupId = stSessions[0].session?.groupId || "";
      const group: GroupInterface = ArrayHelper.getOne(st.groups || [], "id", groupId);
      selectedGroupName = group?.name || "Error";
    }

    return (
      <div className="checkinServiceTime" key={st.id}>
        <Grid container spacing={3}>
          <Grid item xs={4}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Icon sx={{ marginRight: "5px" }}>watch_later</Icon>
              {st.name}
            </Box>
          </Grid>
          <Grid item xs={8}>
            <a
              className="bigLinkButton serviceTimeButton"
              href="about:blank"
              onClick={(e) => {
                e.preventDefault();
                selectServiceTime(st);
              }}
            >
              {selectedGroupName}
            </a>
          </Grid>
        </Grid>
      </div>
    );
  };

  const selectServiceTime = (st: ServiceTimeInterface) => {
    CheckinHelper.selectedServiceTime = st;
    setShowGroups(true);
  };

  const getMemberServiceTimes = () => {
    const visit = ArrayHelper.getOne(pendingVisits, "personId", selectedMember.id);
    const visitSessions = visit?.visitSessions || [];
    let result: JSX.Element[] = [];
    CheckinHelper.serviceTimes.forEach((st) => {
      result.push(getServiceTime(st, visitSessions));
    });
    return result;
  };

  const selectMember = (member: PersonInterface) => {
    if (selectedMember === member) setSelectedMember(null);
    else setSelectedMember(member);
  };

  const getCondensedGroupList = (person: PersonInterface) => {
    if (selectedMember === person) return null;
    else {
      const visit = CheckinHelper.getVisitByPersonId(pendingVisits, person.id || "");
      if (visit?.visitSessions?.length === 0) return null;
      else {
        const groups: JSX.Element[] = [];
        visit?.visitSessions?.forEach((vs: VisitSessionInterface) => {
          const st: ServiceTimeInterface | null = ArrayHelper.getOne(
            CheckinHelper.serviceTimes,
            "id",
            vs.session?.serviceTimeId || ""
          );
          const group: GroupInterface = ArrayHelper.getOne(st?.groups || [], "id", vs.session?.groupId || "");
          //const group: GroupInterface = ArrayHelper.getOne()
          let name = group.name || "none";
          if (st != null) name = (st.name || "") + " - " + name;
          // if (groups.length > 0) groups.push(<Text key={vs.id?.toString() + "comma"} style={{ color: StyleConstants.grayColor }}>, </Text>);
          groups.push(<span key={vs.id?.toString()}>{name}</span>);
        });
        return <div className="groups">{groups}</div>;
      }
    }
  };

  const getMember = (member: PersonInterface) => {
    const arrow = member === selectedMember ? <Icon>keyboard_arrow_down</Icon> : <Icon>keyboard_arrow_right</Icon>;
    const serviceTimeList = member === selectedMember ? getMemberServiceTimes() : null;
    return (
      <>
        <a
          href="about:blank"
          className="bigLinkButton checkinPerson"
          onClick={(e) => {
            e.preventDefault();
            selectMember(member);
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={1}>
              {arrow}
            </Grid>
            <Grid item xs={2}>
              <img src={PersonHelper.getPhotoUrl(member)} alt="avatar" />
            </Grid>
            <Grid item xs={9}>
              {member.name.display}
              {getCondensedGroupList(member)}
            </Grid>
          </Grid>
        </a>
        {serviceTimeList}
      </>
    );
  };

  const handleCheckin = () => {
    setIsLoading(true);
    const peopleIds: number[] = ArrayHelper.getUniqueValues(CheckinHelper.householdMembers, "id");
    const url = "/visits/checkin?serviceId=" + CheckinHelper.serviceId + "&peopleIds=" + escape(peopleIds.join(","));
    ApiHelper.post(url, CheckinHelper.pendingVisits, "AttendanceApi").then(() => {
      completeHandler();
    });
  };

  useEffect(() => {
    setPendingVisits(CheckinHelper.pendingVisits);
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (showGroups) {
    return <Groups selectedHandler={handleGroupSelected} />;
  }

  return (
    <>
      {CheckinHelper.householdMembers.map((member) => getMember(member))}
      <br />
      <Button fullWidth size="large" variant="contained" onClick={handleCheckin}>
        Checkin
      </Button>
    </>
  );
}
