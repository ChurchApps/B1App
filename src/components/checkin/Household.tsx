"use client"
import React, { useState, useEffect } from "react";
import { Button, Icon, Grid, Box, Card, CardActionArea, Typography, Chip, Divider } from "@mui/material";
import { CheckinHelper } from "@/helpers";
import { Groups } from "./Groups";
import { ArrayHelper } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { Loading } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import type { VisitInterface, GroupInterface, PersonInterface, ServiceTimeInterface, VisitSessionInterface } from "@churchapps/helpers";

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
    let selectedGroupName = "No group selected";
    let hasSelection = false;
    if (stSessions.length > 0) {
      const groupId = stSessions[0].session?.groupId || "";
      const group: GroupInterface = ArrayHelper.getOne(st.groups || [], "id", groupId);
      selectedGroupName = group?.name || "None";
      hasSelection = true;
    }

    return (
      <Box
        key={st.id}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 2,
          backgroundColor: "#F6F6F8",
          borderBottom: "1px solid #F0F0F0",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#FFFFFF",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 1.5,
            }}
          >
            <Icon sx={{ fontSize: 20, color: "#0D47A1" }}>schedule</Icon>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: "#3c3c3c", fontWeight: 600, marginBottom: 0.25 }}>
              {st.name}
            </Typography>
            <Typography variant="body2" sx={{ color: "#9E9E9E" }}>
              {selectedGroupName}
            </Typography>
          </Box>
        </Box>
        <Button
          variant={hasSelection ? "contained" : "outlined"}
          size="small"
          onClick={() => selectServiceTime(st)}
          data-testid={`service-time-${st.id}`}
          sx={{
            borderRadius: 2,
            minWidth: 100,
            backgroundColor: hasSelection ? "#70DC87" : "transparent",
            "&:hover": {
              backgroundColor: hasSelection ? "#5FC876" : "rgba(0,0,0,0.04)",
            },
          }}
        >
          {hasSelection ? "Change" : "Select Group"}
        </Button>
      </Box>
    );
  };

  const selectServiceTime = (st: ServiceTimeInterface) => {
    CheckinHelper.selectedServiceTime = st;
    setShowGroups(true);
  };

  const getMemberServiceTimes = () => {
    const visit = ArrayHelper.getOne(pendingVisits, "personId", selectedMember.id);
    const visitSessions = visit?.visitSessions || [];
    let result: React.ReactElement[] = [];
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
      if (visit?.visitSessions?.length === 0) {
        return (
          <Typography variant="body2" sx={{ color: "#9E9E9E", fontStyle: "italic" }}>
            Tap to select groups
          </Typography>
        );
      } else {
        const groups: React.ReactElement[] = [];
        visit?.visitSessions?.forEach((vs: VisitSessionInterface) => {
          const st: ServiceTimeInterface | null = ArrayHelper.getOne(
            CheckinHelper.serviceTimes,
            "id",
            vs.session?.serviceTimeId || ""
          );
          const group: GroupInterface = ArrayHelper.getOne(st?.groups || [], "id", vs.session?.groupId || "");
          let name = group?.name || "none";
          groups.push(
            <Chip
              key={vs.id?.toString()}
              label={name}
              size="small"
              sx={{
                marginRight: 0.5,
                marginBottom: 0.5,
                backgroundColor: "rgba(13, 71, 161, 0.1)",
                borderColor: "#0D47A1",
                border: "1px solid",
                color: "#0D47A1",
                fontSize: 12,
              }}
            />
          );
        });
        return <Box sx={{ display: "flex", flexWrap: "wrap" }}>{groups}</Box>;
      }
    }
  };

  const getMember = (member: PersonInterface) => {
    const isExpanded = member === selectedMember;
    const serviceTimeList = isExpanded ? getMemberServiceTimes() : null;
    return (
      <Card
        key={member.id}
        sx={{
          borderRadius: 3,
          marginBottom: 1.5,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <CardActionArea
          onClick={() => selectMember(member)}
          data-testid={`select-member-${member.id}`}
          sx={{ padding: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Icon sx={{ marginRight: 2, color: "#9E9E9E" }}>
              {isExpanded ? "expand_less" : "expand_more"}
            </Icon>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                marginRight: 2,
                overflow: "hidden",
              }}
            >
              <img
                src={PersonHelper.getPhotoUrl(member)}
                alt={`${member.name.display} avatar`}
                data-testid={`member-photo-${member.id}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: "#3c3c3c", fontWeight: 600, marginBottom: 1 }}>
                {member.name.display}
              </Typography>
              {!isExpanded && getCondensedGroupList(member)}
            </Box>
          </Box>
        </CardActionArea>
        {isExpanded && <Divider sx={{ backgroundColor: "#F0F0F0" }} />}
        {serviceTimeList}
      </Card>
    );
  };

  const handleCheckin = () => {
    setIsLoading(true);
    const peopleIds: number[] = ArrayHelper.getUniqueValues(CheckinHelper.householdMembers, "id");
    const url = "/visits/checkin?serviceId=" + CheckinHelper.serviceId + "&peopleIds=" + encodeURIComponent(peopleIds.join(","));
    ApiHelper.post(url, CheckinHelper.pendingVisits, "AttendanceApi").then(() => {
      completeHandler();
    });
  };

  useEffect(() => {
    setPendingVisits(CheckinHelper.pendingVisits);
  }, []);

  if (isLoading) {
    return <Loading data-testid="checkin-loading" />;
  }

  if (showGroups) {
    return <Groups selectedHandler={handleGroupSelected} />;
  }

  return (
    <>
      {/* Header Section */}
      <Box
        sx={{
          backgroundColor: "#FFFFFF",
          padding: 3,
          textAlign: "center",
          borderRadius: 2,
          marginBottom: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#F6F6F8",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon sx={{ fontSize: 48, color: "#0D47A1" }}>people</Icon>
        </Box>
        <Typography variant="h4" sx={{ color: "#3c3c3c", fontWeight: 700, marginBottom: 1 }}>
          Household Members
        </Typography>
        <Typography variant="body1" sx={{ color: "#9E9E9E" }}>
          Select groups for each family member
        </Typography>
      </Box>

      {/* Members List */}
      {!CheckinHelper.householdMembers || CheckinHelper.householdMembers.length === 0 ? (
        <Card sx={{ borderRadius: 3, padding: 4, textAlign: "center" }}>
          <Icon sx={{ fontSize: 64, color: "#9E9E9E" }}>person_off</Icon>
          <Typography variant="h6" sx={{ color: "#3c3c3c", fontWeight: 600, marginTop: 2, marginBottom: 1 }}>
            No Household Members Found
          </Typography>
          <Typography variant="body2" sx={{ color: "#9E9E9E" }}>
            Please ensure you are logged in and have household members registered.
          </Typography>
        </Card>
      ) : (
        CheckinHelper.householdMembers.map((member) => getMember(member))
      )}

      {/* Bottom Action */}
      <Box sx={{ marginTop: 3 }}>
        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={handleCheckin}
          data-testid="checkin-submit-button"
          startIcon={<Icon>check_circle</Icon>}
          sx={{
            backgroundColor: "#0D47A1",
            borderRadius: 3,
            height: 56,
            fontWeight: 700,
            fontSize: 16,
            boxShadow: "0 2px 4px rgba(13, 71, 161, 0.2)",
            "&:hover": {
              backgroundColor: "#0B3D8F",
            },
          }}
        >
          Complete Check-in
        </Button>
      </Box>
    </>
  );
}
