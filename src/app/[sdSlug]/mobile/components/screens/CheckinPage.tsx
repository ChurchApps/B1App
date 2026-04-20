"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  CardActionArea,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Icon,
  Typography
} from "@mui/material";
import { ApiHelper, ArrayHelper, PersonHelper as ApphelperPersonHelper, UserHelper } from "@churchapps/apphelper";
import type {
  GroupInterface,
  GroupServiceTimeInterface,
  PersonInterface,
  ServiceInterface,
  ServiceTimeInterface,
  VisitInterface,
  VisitSessionInterface
} from "@churchapps/helpers";
import { CheckinHelper, PersonHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";

interface Props {
  config: ConfigurationInterface;
}

type Step = "services" | "household" | "groups" | "complete";

interface GroupCategory {
  key: number;
  name: string;
  items: GroupInterface[];
}

const tc = mobileTheme.colors;
const spacing = mobileTheme.spacing;
const radius = mobileTheme.radius;
const shadows = mobileTheme.shadows;

const SurfaceCard = ({ children, sx }: { children: React.ReactNode; sx?: object }) => (
  <Box
    sx={{
      bgcolor: tc.surface,
      borderRadius: `${radius.lg}px`,
      boxShadow: shadows.sm,
      overflow: "hidden",
      mb: `${spacing.sm + 4}px`,
      ...sx
    }}
  >
    {children}
  </Box>
);

const IconCircle = ({
  size = 56,
  bg = tc.iconBackground,
  children,
  sx
}: {
  size?: number;
  bg?: string;
  children: React.ReactNode;
  sx?: object;
}) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: "50%",
      bgcolor: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      ...sx
    }}
  >
    {children}
  </Box>
);

const ScreenSubhead = ({
  iconName,
  subtitle
}: {
  iconName: string;
  subtitle: string;
}) => (
  <Box
    sx={{
      bgcolor: tc.surface,
      borderRadius: `${radius.xl}px`,
      boxShadow: shadows.sm,
      px: `${spacing.lg}px`,
      py: `${spacing.lg}px`,
      mb: `${spacing.md}px`,
      textAlign: "center"
    }}
  >
    <IconCircle size={72} sx={{ mx: "auto", mb: `${spacing.sm + 4}px` }}>
      <Icon sx={{ fontSize: 40, color: tc.primary }}>{iconName}</Icon>
    </IconCircle>
    <Typography sx={{ fontSize: 14, color: tc.textMuted, maxWidth: 320, mx: "auto" }}>
      {subtitle}
    </Typography>
  </Box>
);

const EmptyState = ({
  iconName,
  title,
  message
}: {
  iconName: string;
  title: string;
  message: string;
}) => (
  <Box
    sx={{
      bgcolor: tc.surface,
      borderRadius: `${radius.xl}px`,
      boxShadow: shadows.sm,
      p: `${spacing.lg}px`,
      textAlign: "center"
    }}
  >
    <IconCircle size={64} sx={{ mx: "auto", mb: `${spacing.md}px` }}>
      <Icon sx={{ fontSize: 32, color: tc.primary }}>{iconName}</Icon>
    </IconCircle>
    <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.5 }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: 14, color: tc.textMuted }}>{message}</Typography>
  </Box>
);

const ServicesStep = ({ onSelected }: { onSelected: () => void }) => {
  const [selectingId, setSelectingId] = useState<string>("");

  const { data: services = [], isLoading } = useQuery<ServiceInterface[]>({
    queryKey: ["/services", "AttendanceApi"],
    queryFn: async () => {
      const data = await ApiHelper.get("/services", "AttendanceApi");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const selectService = async (serviceId: string) => {
    setSelectingId(serviceId);
    try {
      await Promise.all([
        ApiHelper.get("/servicetimes?serviceId=" + serviceId, "AttendanceApi").then(
          (times: ServiceTimeInterface[]) => {
            CheckinHelper.serviceId = serviceId;
            CheckinHelper.serviceTimes = times;
          }
        ),
        ApiHelper.get("/groupservicetimes", "AttendanceApi").then(
          (gst: GroupServiceTimeInterface[]) => {
            CheckinHelper.groupServiceTimes = gst;
          }
        ),
        ApiHelper.get("/groups", "MembershipApi").then((groups: GroupInterface[]) => {
          CheckinHelper.groups = groups;
        }),
        ApiHelper.get(
          "/people/household/" + PersonHelper.person.householdId,
          "MembershipApi"
        ).then((members: PersonInterface[]) => {
          CheckinHelper.householdMembers = members;
        })
      ]);

      const peopleIds: number[] = ArrayHelper.getUniqueValues(
        CheckinHelper.householdMembers,
        "id"
      );
      const url =
        "/visits/checkin?serviceId=" +
        CheckinHelper.serviceId +
        "&peopleIds=" +
        encodeURIComponent(peopleIds.join(",")) +
        "&include=visitSessions";
      CheckinHelper.existingVisits = await ApiHelper.get(url, "AttendanceApi");
      CheckinHelper.pendingVisits = [...CheckinHelper.existingVisits];

      CheckinHelper.serviceTimes.forEach((st) => {
        st.groups = [];
        ArrayHelper.getAll(CheckinHelper.groupServiceTimes, "serviceTimeId", st.id).forEach(
          (gst: GroupServiceTimeInterface) => {
            const g: GroupInterface = ArrayHelper.getOne(
              CheckinHelper.groups,
              "id",
              gst.groupId
            );
            st.groups?.push(g);
          }
        );
      });

      onSelected();
    } finally {
      setSelectingId("");
    }
  };

  return (
    <>
      <ScreenSubhead iconName="event" subtitle="Choose which service you're checking in for" />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: tc.primary }} />
        </Box>
      ) : services.length === 0 ? (
        <EmptyState
          iconName="event_busy"
          title="No Services Available"
          message="Please check back later or contact your church administrator."
        />
      ) : (
        services.map((service) => (
          <SurfaceCard key={service.id}>
            <CardActionArea
              onClick={() => selectService(service.id!)}
              data-testid={`select-service-${service.id}-button`}
              sx={{ p: `${spacing.md}px`, minHeight: 72 }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconCircle sx={{ mr: `${spacing.md}px` }}>
                  <Icon sx={{ fontSize: 28, color: tc.primary }}>church</Icon>
                </IconCircle>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 0.25 }}
                  >
                    {service.name}
                  </Typography>
                  {service.campus?.name && (
                    <Typography sx={{ fontSize: 14, color: tc.primary, fontWeight: 500 }}>
                      {service.campus.name}
                    </Typography>
                  )}
                </Box>
                {selectingId === service.id ? (
                  <CircularProgress size={22} sx={{ color: tc.primary }} />
                ) : (
                  <Icon sx={{ color: tc.textSecondary }}>chevron_right</Icon>
                )}
              </Box>
            </CardActionArea>
          </SurfaceCard>
        ))
      )}
    </>
  );
};

const GroupsStep = ({
  member,
  time,
  onSelected,
  onBack
}: {
  member: PersonInterface;
  time: ServiceTimeInterface;
  onSelected: (group: GroupInterface | null) => void;
  onBack: () => void;
}) => {
  const [expandedKey, setExpandedKey] = useState<number | null>(null);
  const [tree, setTree] = useState<GroupCategory[]>([]);

  useEffect(() => {
    let category = "";
    const gt: GroupCategory[] = [];
    const sorted = time?.groups
      ?.filter((g) => g != null)
      .sort((a, b) => ((a?.categoryName || "") > (b?.categoryName || "") ? 1 : -1));
    sorted?.forEach((g) => {
      if (g.categoryName !== category) {
        gt.push({ key: gt.length, name: g.categoryName || "", items: [] });
      }
      gt[gt.length - 1].items.push(g);
      category = g.categoryName || "";
    });
    setTree(gt);
  }, [time]);

  return (
    <>
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${radius.xl}px`,
          boxShadow: shadows.sm,
          px: `${spacing.lg}px`,
          py: `${spacing.lg}px`,
          mb: `${spacing.md}px`,
          textAlign: "center"
        }}
      >
        <IconCircle size={72} sx={{ mx: "auto", mb: `${spacing.sm + 4}px` }}>
          <Icon sx={{ fontSize: 40, color: tc.primary }}>groups</Icon>
        </IconCircle>
        <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 0.5 }}>
          Choose a group for {member.name?.display}
        </Typography>
        {time?.name && (
          <Typography sx={{ fontSize: 14, color: tc.primary, fontWeight: 600 }}>
            Service: {time.name}
          </Typography>
        )}
      </Box>

      {tree.length === 0 ? (
        <EmptyState
          iconName="group_off"
          title="No Groups Available"
          message="There are no groups configured for this service."
        />
      ) : (
        tree.map((cat) => {
          const isOpen = expandedKey === cat.key;
          return (
            <SurfaceCard key={cat.key}>
              <CardActionArea
                onClick={() => setExpandedKey(isOpen ? null : cat.key)}
                sx={{ p: `${spacing.md}px` }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconCircle size={40} sx={{ mr: `${spacing.sm + 4}px` }}>
                    <Icon sx={{ fontSize: 22, color: tc.primary }}>folder</Icon>
                  </IconCircle>
                  <Typography
                    sx={{ flex: 1, fontSize: 16, fontWeight: 600, color: tc.text }}
                  >
                    {cat.name || "General Groups"}
                  </Typography>
                  <Icon sx={{ color: tc.textSecondary }}>
                    {isOpen ? "expand_less" : "expand_more"}
                  </Icon>
                </Box>
              </CardActionArea>
              {isOpen && (
                <>
                  <Divider sx={{ bgcolor: tc.divider }} />
                  <Box sx={{ bgcolor: tc.background }}>
                    {cat.items.map((g, idx) => (
                      <Box
                        key={g.id}
                        sx={{
                          borderBottom:
                            idx < cat.items.length - 1
                              ? `1px solid ${tc.divider}`
                              : "none"
                        }}
                      >
                        <CardActionArea
                          onClick={() => onSelected(g)}
                          sx={{ py: `${spacing.md}px`, px: `${spacing.lg}px` }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <IconCircle
                              size={32}
                              bg={tc.surface}
                              sx={{ mr: `${spacing.sm + 4}px` }}
                            >
                              <Icon sx={{ fontSize: 18, color: tc.secondary }}>group</Icon>
                            </IconCircle>
                            <Typography
                              sx={{ flex: 1, fontSize: 15, fontWeight: 500, color: tc.text }}
                            >
                              {g.name}
                            </Typography>
                            <Icon sx={{ color: tc.textSecondary, fontSize: 20 }}>
                              chevron_right
                            </Icon>
                          </Box>
                        </CardActionArea>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </SurfaceCard>
          );
        })
      )}

      <Box sx={{ mt: `${spacing.md}px`, display: "flex", gap: `${spacing.sm}px` }}>
        <Button
          variant="outlined"
          onClick={onBack}
          startIcon={<Icon>arrow_back</Icon>}
          sx={{
            borderColor: tc.border,
            color: tc.textSecondary,
            borderRadius: `${radius.lg}px`,
            height: 48,
            fontWeight: 600,
            textTransform: "none"
          }}
        >
          Back
        </Button>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => onSelected(null)}
          data-testid="checkin-none-button"
          startIcon={<Icon>close</Icon>}
          sx={{
            borderColor: tc.disabled,
            color: tc.textSecondary,
            borderRadius: `${radius.lg}px`,
            height: 48,
            fontWeight: 600,
            textTransform: "none"
          }}
        >
          No Group
        </Button>
      </Box>
    </>
  );
};

const HouseholdStep = ({
  onShowGroups,
  onComplete,
  onBack
}: {
  onShowGroups: (member: PersonInterface, time: ServiceTimeInterface) => void;
  onComplete: () => void;
  onBack: () => void;
}) => {
  const [selectedMember, setSelectedMember] = useState<PersonInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateNames, setDuplicateNames] = useState<string[]>([]);

  const isCheckedIn = (personId: string): boolean => {
    const visit = CheckinHelper.getVisitByPersonId(CheckinHelper.existingVisits, personId);
    return !!(visit && visit.id);
  };

  const selectServiceTime = (member: PersonInterface, st: ServiceTimeInterface) => {
    CheckinHelper.selectedServiceTime = st;
    onShowGroups(member, st);
  };

  const renderServiceTime = (
    member: PersonInterface,
    st: ServiceTimeInterface,
    visitSessions: VisitSessionInterface[]
  ) => {
    const stSessions = ArrayHelper.getAll(visitSessions, "session.serviceTimeId", st.id);
    let selectedGroupName = "No group selected";
    let hasSelection = false;
    if (stSessions.length > 0) {
      const groupId = stSessions[0].session?.groupId || "";
      const validGroups = (st.groups || []).filter((g) => g != null);
      const group: GroupInterface = ArrayHelper.getOne(validGroups, "id", groupId);
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
          px: `${spacing.md}px`,
          py: `${spacing.md}px`,
          bgcolor: tc.background,
          borderBottom: `1px solid ${tc.divider}`,
          "&:last-child": { borderBottom: "none" }
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
          <IconCircle size={32} bg={tc.surface} sx={{ mr: `${spacing.sm + 4}px` }}>
            <Icon sx={{ fontSize: 18, color: tc.primary }}>schedule</Icon>
          </IconCircle>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text, mb: 0.25 }}>
              {st.name}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: tc.textMuted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {selectedGroupName}
            </Typography>
          </Box>
        </Box>
        <Button
          variant={hasSelection ? "contained" : "outlined"}
          size="small"
          onClick={() => selectServiceTime(member, st)}
          data-testid={`service-time-${st.id}`}
          sx={{
            borderRadius: `${radius.md}px`,
            minWidth: 100,
            ml: 1,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 12,
            ...(hasSelection
              ? {
                bgcolor: tc.success,
                color: tc.onPrimary,
                "&:hover": { bgcolor: tc.success, opacity: 0.9 }
              }
              : {
                borderColor: tc.primary,
                color: tc.primary
              })
          }}
        >
          {hasSelection ? "Change" : "Select Group"}
        </Button>
      </Box>
    );
  };

  const renderMember = (member: PersonInterface) => {
    const isExpanded = selectedMember?.id === member.id;
    const visit = ArrayHelper.getOne(CheckinHelper.pendingVisits, "personId", member.id);
    const visitSessions: VisitSessionInterface[] = visit?.visitSessions || [];

    return (
      <SurfaceCard key={member.id}>
        <CardActionArea
          onClick={() => setSelectedMember(isExpanded ? null : member)}
          data-testid={`select-member-${member.id}`}
          sx={{ p: `${spacing.md}px` }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                overflow: "hidden",
                mr: `${spacing.md}px`,
                flexShrink: 0,
                bgcolor: tc.iconBackground
              }}
            >
              <img
                src={ApphelperPersonHelper.getPhotoUrl(member)}
                alt={`${member.name?.display || "Member"} avatar`}
                data-testid={`member-photo-${member.id}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: tc.text,
                  mb: isCheckedIn(member.id!) || !isExpanded ? 0.5 : 0
                }}
              >
                {member.name?.display}
              </Typography>
              {isCheckedIn(member.id!) && (
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1,
                    py: 0.25,
                    borderRadius: "999px",
                    bgcolor: `${tc.success}1A`,
                    color: tc.success,
                    fontSize: 11,
                    fontWeight: 600,
                    mb: !isExpanded ? 0.5 : 0
                  }}
                >
                  <Icon sx={{ fontSize: 14 }}>check_circle</Icon>
                  Already checked in
                </Box>
              )}
              {!isExpanded && (
                <>
                  {visitSessions.length === 0 ? (
                    <Typography sx={{ fontSize: 13, color: tc.textMuted, fontStyle: "italic" }}>
                      Tap to select groups
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {visitSessions.map((vs) => {
                        const st: ServiceTimeInterface | null = ArrayHelper.getOne(
                          CheckinHelper.serviceTimes,
                          "id",
                          vs.session?.serviceTimeId || ""
                        );
                        const group: GroupInterface = ArrayHelper.getOne(
                          st?.groups || [],
                          "id",
                          vs.session?.groupId || ""
                        );
                        const name = group?.name || "none";
                        return (
                          <Box
                            key={
                              vs.id?.toString() ||
                              `${vs.session?.serviceTimeId}-${vs.session?.groupId}`
                            }
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: "999px",
                              bgcolor: `${tc.primary}1A`,
                              color: tc.primary,
                              border: `1px solid ${tc.primary}`,
                              fontSize: 12,
                              fontWeight: 500
                            }}
                          >
                            {name}
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </>
              )}
            </Box>
            <Icon sx={{ color: tc.textSecondary, ml: 1 }}>
              {isExpanded ? "expand_less" : "expand_more"}
            </Icon>
          </Box>
        </CardActionArea>
        {isExpanded && (
          <>
            <Divider sx={{ bgcolor: tc.divider }} />
            <Box>
              {CheckinHelper.serviceTimes?.map((st) =>
                renderServiceTime(member, st, visitSessions))}
            </Box>
          </>
        )}
      </SurfaceCard>
    );
  };

  const handleCheckin = () => {
    const already: string[] = [];
    CheckinHelper.pendingVisits.forEach((pv) => {
      if (pv.visitSessions && pv.visitSessions.length > 0) {
        const existing = CheckinHelper.getVisitByPersonId(
          CheckinHelper.existingVisits,
          pv.personId || ""
        );
        if (existing && existing.id) {
          const person = CheckinHelper.householdMembers.find((m) => m.id === pv.personId);
          if (person) already.push(person.name?.display || "Unknown");
        }
      }
    });
    if (already.length > 0) {
      setDuplicateNames(already);
      setShowDuplicateDialog(true);
    } else {
      doCheckin();
    }
  };

  const doCheckin = () => {
    setShowDuplicateDialog(false);
    setIsLoading(true);
    const peopleIds: number[] = ArrayHelper.getUniqueValues(
      CheckinHelper.householdMembers,
      "id"
    );
    const url =
      "/visits/checkin?serviceId=" +
      CheckinHelper.serviceId +
      "&peopleIds=" +
      encodeURIComponent(peopleIds.join(","));
    ApiHelper.post(url, CheckinHelper.pendingVisits, "AttendanceApi")
      .then(() => onComplete())
      .finally(() => setIsLoading(false));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress sx={{ color: tc.primary }} />
      </Box>
    );
  }

  return (
    <>
      <ScreenSubhead iconName="people" subtitle="Select groups for each family member" />

      {!CheckinHelper.householdMembers || CheckinHelper.householdMembers.length === 0 ? (
        <EmptyState
          iconName="person_off"
          title="No Household Members Found"
          message="Please ensure you are signed in and have household members registered."
        />
      ) : (
        CheckinHelper.householdMembers.map((m) => renderMember(m))
      )}

      <Box sx={{ mt: `${spacing.md}px`, display: "flex", gap: `${spacing.sm}px` }}>
        <Button
          variant="outlined"
          onClick={onBack}
          startIcon={<Icon>arrow_back</Icon>}
          sx={{
            borderColor: tc.border,
            color: tc.textSecondary,
            borderRadius: `${radius.lg}px`,
            height: 56,
            fontWeight: 600,
            textTransform: "none"
          }}
        >
          Back
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleCheckin}
          data-testid="checkin-submit-button"
          startIcon={<Icon>check_circle</Icon>}
          sx={{
            bgcolor: tc.primary,
            color: tc.onPrimary,
            borderRadius: `${radius.lg}px`,
            height: 56,
            fontWeight: 700,
            fontSize: 16,
            textTransform: "none",
            boxShadow: shadows.md,
            "&:hover": { bgcolor: tc.primary, opacity: 0.92 }
          }}
        >
          Complete Check-in
        </Button>
      </Box>

      <Dialog open={showDuplicateDialog} onClose={() => setShowDuplicateDialog(false)}>
        <DialogTitle>Already Checked In</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {duplicateNames.join(", ")} already checked in for this service. Check in again to
            update their groups.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDuplicateDialog(false)}>Cancel</Button>
          <Button
            onClick={doCheckin}
            variant="contained"
            sx={{
              bgcolor: tc.primary,
              color: tc.onPrimary,
              "&:hover": { bgcolor: tc.primary, opacity: 0.92 }
            }}
          >
            Check In Again
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const CompleteStep = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const id = setTimeout(() => onDone(), 1500);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <Box
      data-testid="checkin-complete"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        borderRadius: `${radius.xl}px`,
        background: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        p: `${spacing.xl}px`
      }}
    >
      <Box sx={{ textAlign: "center", maxWidth: 400, width: "100%" }}>
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.92)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            mb: `${spacing.lg}px`,
            boxShadow: shadows.lg
          }}
        >
          <Icon sx={{ fontSize: 80, color: tc.success }}>check_circle</Icon>
        </Box>
        <Typography
          sx={{
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: 26,
            mb: `${spacing.sm}px`,
            textShadow: "0 2px 4px rgba(0,0,0,0.25)"
          }}
        >
          Check-in Complete
        </Typography>
        <Typography
          sx={{
            color: "#FFFFFF",
            opacity: 0.9,
            fontSize: 15,
            textShadow: "0 1px 2px rgba(0,0,0,0.2)"
          }}
        >
          Your attendance has been saved. Thank you!
        </Typography>
      </Box>
    </Box>
  );
};

export const CheckinPage = ({ config: _config }: Props) => {
  const [step, setStep] = useState<Step>("services");
  const [groupsMember, setGroupsMember] = useState<PersonInterface | null>(null);
  const [groupsTime, setGroupsTime] = useState<ServiceTimeInterface | null>(null);

  const handleCompleteDone = useCallback(() => {
    CheckinHelper.clearData();
    setGroupsMember(null);
    setGroupsTime(null);
    setStep("services");
  }, []);

  const handleGroupSelected = useCallback(
    (group: GroupInterface | null) => {
      if (!groupsMember || !groupsTime) {
        setStep("household");
        return;
      }
      const groupId = group ? group.id || "" : "";
      const groupName = group ? group.name || "None" : "None";
      let visit: VisitInterface | null = CheckinHelper.getVisitByPersonId(
        CheckinHelper.pendingVisits,
        groupsMember.id || ""
      );
      if (visit === null) {
        visit = {
          personId: groupsMember.id,
          serviceId: groupsTime.serviceId,
          visitSessions: []
        };
        CheckinHelper.pendingVisits.push(visit);
      }
      const vs = visit.visitSessions || [];
      CheckinHelper.setGroup(vs, groupsTime.id!, groupId, groupName);
      if (!visit.visitSessions) visit.visitSessions = vs;
      setStep("household");
    },
    [groupsMember, groupsTime]
  );

  if (!UserHelper.user?.firstName) {
    return (
      <Box sx={{ p: `${spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
        <EmptyState
          iconName="how_to_reg"
          title="Please sign in to check in"
          message="Log in to check in to a service."
        />
      </Box>
    );
  }

  let content: React.ReactNode = null;
  if (step === "services") {
    content = <ServicesStep onSelected={() => setStep("household")} />;
  } else if (step === "household") {
    content = (
      <HouseholdStep
        onShowGroups={(member, time) => {
          setGroupsMember(member);
          setGroupsTime(time);
          setStep("groups");
        }}
        onComplete={() => setStep("complete")}
        onBack={() => setStep("services")}
      />
    );
  } else if (step === "groups" && groupsMember && groupsTime) {
    content = (
      <GroupsStep
        member={groupsMember}
        time={groupsTime}
        onSelected={handleGroupSelected}
        onBack={() => setStep("household")}
      />
    );
  } else if (step === "complete") {
    content = <CompleteStep onDone={handleCompleteDone} />;
  }

  return (
    <Box sx={{ p: `${spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      {content}
    </Box>
  );
};
