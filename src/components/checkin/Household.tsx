"use client";
import React, { useState, useEffect } from "react";
import { Button, Icon, Box, CardActionArea, Typography, Chip, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { CheckinHelper } from "@/helpers";
import { Groups } from "./Groups";
import { ArrayHelper } from "@churchapps/apphelper";
import { ApiHelper } from "@churchapps/apphelper";
import { Loading } from "@churchapps/apphelper";
import { Locale } from "@churchapps/apphelper";
import { PersonHelper } from "@churchapps/apphelper";
import { HeaderSection, HeaderIconContainer, CheckinCard, SmallIconCircle, ServiceTimeItem, EmptyStateCard, colors } from "./CheckinStyles";
import type { VisitInterface, GroupInterface, PersonInterface, ServiceTimeInterface, VisitSessionInterface } from "@churchapps/helpers";

interface Props {
  completeHandler: () => void;
}

export function Household({ completeHandler = () => { } }: Props) {
  const [showGroups, setShowGroups] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingVisits, setPendingVisits] = useState<VisitInterface[]>(null);
  const [selectedMember, setSelectedMember] = useState<PersonInterface>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState<boolean>(false);
  const [duplicateNames, setDuplicateNames] = useState<string[]>([]);

  const isCheckedIn = (personId: string): boolean => {
    const visit = CheckinHelper.getVisitByPersonId(CheckinHelper.existingVisits, personId);
    return visit !== null && visit !== undefined && visit.id !== null && visit.id !== undefined;
  };

  const handleGroupSelected = (group: GroupInterface) => {
    const groupId = group ? group.id : "";
    const groupName = group ? group.name : Locale.label("checkin.household.none");

    let visit: VisitInterface = CheckinHelper.getVisitByPersonId(CheckinHelper.pendingVisits, selectedMember.id);
    if (visit === null) {
      visit = {
        personId: selectedMember.id,
        serviceId: CheckinHelper.selectedServiceTime.serviceId,
        visitSessions: []
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
    let selectedGroupName = Locale.label("checkin.household.noGroupSelected");
    let hasSelection = false;
    if (stSessions.length > 0) {
      const groupId = stSessions[0].session?.groupId || "";
      const validGroups = (st.groups || []).filter((g) => g != null);
      const group: GroupInterface = ArrayHelper.getOne(validGroups, "id", groupId);
      selectedGroupName = group?.name || Locale.label("checkin.household.none");
      hasSelection = true;
    }

    return (
      <ServiceTimeItem key={st.id}>
        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          <SmallIconCircle>
            <Icon sx={{ fontSize: 20, color: colors.primary }}>schedule</Icon>
          </SmallIconCircle>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: colors.textPrimary, fontWeight: 600, marginBottom: 0.25 }}>
              {st.name}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
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
            backgroundColor: hasSelection ? colors.success : "transparent",
            "&:hover": { backgroundColor: hasSelection ? colors.successHover : "rgba(0,0,0,0.04)" }
          }}
        >
          {hasSelection ? Locale.label("checkin.household.change") : Locale.label("checkin.groups.selectGroup")}
        </Button>
      </ServiceTimeItem>
    );
  };

  const selectServiceTime = (st: ServiceTimeInterface) => {
    CheckinHelper.selectedServiceTime = st;
    setShowGroups(true);
  };

  const getMemberServiceTimes = () => {
    const visit = ArrayHelper.getOne(pendingVisits, "personId", selectedMember.id);
    const visitSessions = visit?.visitSessions || [];
    const result: React.ReactElement[] = [];
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
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontStyle: "italic" }}>
            {Locale.label("checkin.household.tapToSelect")}
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
          const name = group?.name || Locale.label("checkin.household.noneLower");
          groups.push(
            <Chip
              key={vs.id?.toString()}
              label={name}
              size="small"
              sx={{
                marginRight: 0.5,
                marginBottom: 0.5,
                backgroundColor: `${colors.primary}1A`,
                borderColor: colors.primary,
                border: "1px solid",
                color: colors.primary,
                fontSize: 12
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
      <CheckinCard key={member.id}>
        <CardActionArea
          onClick={() => selectMember(member)}
          data-testid={`select-member-${member.id}`}
          sx={{ padding: 2 }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Icon sx={{ marginRight: 2, color: colors.textSecondary }}>
              {isExpanded ? "expand_less" : "expand_more"}
            </Icon>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                marginRight: 2,
                overflow: "hidden"
              }}
            >
              <img
                src={PersonHelper.getPhotoUrl(member)}
                alt={Locale.label("checkin.household.memberAvatar").replace("{}", member.name?.display || Locale.label("checkin.household.member"))}
                data-testid={`member-photo-${member.id}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600, marginBottom: isCheckedIn(member.id) ? 0.5 : 1 }}>
                {member.name?.display}
              </Typography>
              {isCheckedIn(member.id) && (
                <Chip
                  icon={<Icon sx={{ fontSize: "16px !important" }}>check_circle</Icon>}
                  label={Locale.label("checkin.household.alreadyCheckedIn")}
                  size="small"
                  sx={{
                    backgroundColor: `${colors.success}1A`,
                    color: colors.success,
                    fontWeight: 600,
                    fontSize: 11,
                    height: 24,
                    marginBottom: 0.5,
                    "& .MuiChip-icon": { color: colors.success }
                  }}
                />
              )}
              {!isExpanded && getCondensedGroupList(member)}
            </Box>
          </Box>
        </CardActionArea>
        {isExpanded && <Divider sx={{ backgroundColor: colors.border }} />}
        {serviceTimeList}
      </CheckinCard>
    );
  };

  const handleCheckin = () => {
    const alreadyCheckedInNames: string[] = [];
    CheckinHelper.pendingVisits.forEach(pv => {
      if (pv.visitSessions && pv.visitSessions.length > 0) {
        const existingVisit = CheckinHelper.getVisitByPersonId(CheckinHelper.existingVisits, pv.personId || "");
        if (existingVisit && existingVisit.id) {
          const person = CheckinHelper.householdMembers.find(m => m.id === pv.personId);
          if (person) alreadyCheckedInNames.push(person.name?.display || Locale.label("checkin.household.unknown"));
        }
      }
    });

    if (alreadyCheckedInNames.length > 0) {
      setDuplicateNames(alreadyCheckedInNames);
      setShowDuplicateDialog(true);
    } else {
      doCheckin();
    }
  };

  const doCheckin = () => {
    setShowDuplicateDialog(false);
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
      <HeaderSection>
        <HeaderIconContainer>
          <Icon sx={{ fontSize: 48, color: colors.primary }}>people</Icon>
        </HeaderIconContainer>
        <Typography variant="h4" sx={{ color: colors.textPrimary, fontWeight: 700, marginBottom: 1 }}>
          {Locale.label("checkin.household.title")}
        </Typography>
        <Typography variant="body1" sx={{ color: colors.textSecondary }}>
          {Locale.label("checkin.household.subtitle")}
        </Typography>
      </HeaderSection>

      {/* Members List */}
      {!CheckinHelper.householdMembers || CheckinHelper.householdMembers.length === 0
        ? (
          <EmptyStateCard>
            <Icon sx={{ fontSize: 64, color: colors.textSecondary }}>person_off</Icon>
            <Typography variant="h6" sx={{ color: colors.textPrimary, fontWeight: 600, marginTop: 2, marginBottom: 1 }}>
              {Locale.label("checkin.household.noMembersFound")}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              {Locale.label("checkin.household.loginPrompt")}
            </Typography>
          </EmptyStateCard>
        )
        : (
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
            backgroundColor: colors.primary,
            borderRadius: 3,
            height: 56,
            fontWeight: 700,
            fontSize: 16,
            boxShadow: `0 2px 4px ${colors.primary}33`,
            "&:hover": { backgroundColor: colors.primaryHover }
          }}
        >
          {Locale.label("checkin.household.completeCheckin")}
        </Button>
      </Box>

      <Dialog open={showDuplicateDialog} onClose={() => setShowDuplicateDialog(false)}>
        <DialogTitle>{Locale.label("checkin.household.alreadyCheckedInTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {Locale.label("checkin.household.duplicateMessage").replace("{}", duplicateNames.join(", "))}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDuplicateDialog(false)}>{Locale.label("common.cancel")}</Button>
          <Button onClick={doCheckin} variant="contained" sx={{ backgroundColor: colors.primary, "&:hover": { backgroundColor: colors.primaryHover } }}>
            {Locale.label("checkin.household.checkInAgain")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
