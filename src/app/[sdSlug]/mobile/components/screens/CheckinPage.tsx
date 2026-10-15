"use client";

import React, { useCallback, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { QRCodeSVG } from "qrcode.react";
import { ApiHelper, ArrayHelper, Locale } from "@churchapps/apphelper";
import type {
  CampusInterface,
  GroupInterface,
  GroupServiceTimeInterface,
  PersonInterface,
  ServiceInterface,
  ServiceTimeInterface,
  VisitInterface,
  VisitSessionInterface
} from "@churchapps/helpers";
import UserContext from "@/context/UserContext";
import { CheckinHelper, PersonHelper } from "@/helpers";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import { mobileTheme } from "../mobileTheme";
import { PageHead, Pill, PillRow, Plate, PlateSection, QuietEmpty, Row, RowList, Sheet, StatusBadge, TextLink } from "../kit";

interface Props {
  config: ConfigurationInterface;
}

type Step = "services" | "household" | "groups" | "complete";

type VisitWithCode = VisitInterface & { securityCode?: string };

interface GroupCategory {
  key: number;
  name: string;
  items: GroupInterface[];
}

const tc = mobileTheme.colors;

const Notice = ({ tone, children, testId }: { tone: "error" | "info"; children: React.ReactNode; testId?: string }) => (
  <Typography
    role={tone === "error" ? "alert" : "status"}
    data-testid={testId}
    sx={{ fontSize: 14.5, lineHeight: "21px", fontWeight: tone === "error" ? 600 : 400, color: tone === "error" ? tc.error : tc.textSecondary, mb: "12px" }}
  >
    {children}
  </Typography>
);

const Intro = ({ children }: { children: React.ReactNode }) => (
  <Typography sx={{ fontSize: 14.5, lineHeight: "21px", color: tc.textSecondary, mb: "8px" }}>{children}</Typography>
);

// The Api answers a blocked check-in with 409 and a JSON body; ApiHelper rethrows that body as the message.
const checkinErrorLabel = (e: any) => {
  try {
    const reason = JSON.parse(e?.message || "")?.error;
    if (reason === "notOpen") return Locale.label("mobile.screens.checkinNotOpen");
    if (reason === "capacity") return Locale.label("mobile.screens.checkinFull");
  } catch { /* not a gate response */ }
  return Locale.label("mobile.details.checkConnection");
};

const sessionGroupName = (vs: VisitSessionInterface) => {
  const st: ServiceTimeInterface | null = ArrayHelper.getOne(CheckinHelper.serviceTimes || [], "id", vs.session?.serviceTimeId || "");
  const group: GroupInterface = ArrayHelper.getOne(st?.groups || [], "id", vs.session?.groupId || "");
  return { group: group?.name || Locale.label("mobile.screens.none"), time: st?.name || "" };
};

const ServicesStep = ({ onSelected }: { onSelected: () => void }) => {
  const [selectingId, setSelectingId] = useState<string>("");
  const [error, setError] = useState("");
  const [notOpen, setNotOpen] = useState(false);

  const { data: services = [], isLoading } = useQuery<ServiceInterface[]>({
    queryKey: ["/services", "AttendanceApi"],
    queryFn: async () => {
      const data = await ApiHelper.get("/services", "AttendanceApi");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // Campuses are mastered in the membership module; resolve the campus name by id.
  const { data: campuses = [] } = useQuery<CampusInterface[]>({
    queryKey: ["/campuses", "MembershipApi"],
    queryFn: async () => {
      const data = await ApiHelper.get("/campuses", "MembershipApi");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  const selectService = async (serviceId: string) => {
    setSelectingId(serviceId);
    setError("");
    setNotOpen(false);
    let allClosed = false;
    try {
      const householdId = PersonHelper.person?.householdId;
      await Promise.all([
        ApiHelper.get("/servicetimes?serviceId=" + serviceId, "AttendanceApi").then(
          (times: ServiceTimeInterface[]) => {
            CheckinHelper.serviceId = serviceId;
            // Service times outside their scheduled check-in window can't be checked into.
            CheckinHelper.serviceTimes = (times || []).filter((t) => (t as ServiceTimeInterface & { checkinOpen?: boolean }).checkinOpen !== false);
            allClosed = times?.length > 0 && CheckinHelper.serviceTimes.length === 0;
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
        // Fall back to the current person alone when no household is linked, so the
        // request doesn't become "/people/household/null" and 404 the screen.
        householdId
          ? ApiHelper.get("/people/household/" + householdId, "MembershipApi").then(
            (members: PersonInterface[]) => {
              CheckinHelper.householdMembers = members;
            }
          )
          : Promise.resolve().then(() => {
            CheckinHelper.householdMembers = PersonHelper.person ? [PersonHelper.person] : [];
          })
      ]);
      if (allClosed) {
        setNotOpen(true);
        return;
      }

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
    } catch {
      setError(Locale.label("mobile.details.checkConnection"));
    } finally {
      setSelectingId("");
    }
  };

  return (
    <PlateSection>
      <Intro>{Locale.label("mobile.screens.chooseServiceSubtitle")}</Intro>
      {error && <Notice tone="error">{error}</Notice>}
      {notOpen && <Notice tone="info" testId="checkin-not-open">{Locale.label("mobile.screens.checkinNotOpen")}</Notice>}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : services.length === 0 ? (
        <QuietEmpty>{Locale.label("mobile.screens.noServicesMessage")}</QuietEmpty>
      ) : (
        <RowList>
          {services.map((service) => (
            <Row
              key={service.id}
              onClick={() => selectService(service.id!)}
              data-testid={`select-service-${service.id}-button`}
              title={service.name}
              subtitle={campuses.find((c) => c.id === service.campusId)?.name}
              trailing={selectingId === service.id ? <CircularProgress size={20} /> : undefined}
              chevron={selectingId !== service.id}
            />
          ))}
        </RowList>
      )}
    </PlateSection>
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
      <PlateSection>
        <Typography sx={{ fontSize: 17, fontWeight: 600, color: tc.text }}>
          {Locale.label("mobile.screens.chooseGroupFor").replace("{}", member.name?.display || "")}
        </Typography>
        {time?.name && (
          <Typography sx={{ fontSize: 14, color: tc.textSecondary }}>
            {Locale.label("mobile.screens.serviceLabel").replace("{}", time.name)}
          </Typography>
        )}
        {tree.length === 0 && <QuietEmpty sx={{ mt: "12px" }}>{Locale.label("mobile.screens.noGroupsMessage")}</QuietEmpty>}
      </PlateSection>

      {tree.map((cat) => (
        <PlateSection key={cat.key} title={cat.name || Locale.label("mobile.screens.generalGroups")}>
          <RowList>
            {cat.items.map((g) => (
              <Row key={g.id} onClick={() => onSelected(g)} title={g.name} chevron />
            ))}
          </RowList>
        </PlateSection>
      ))}

      <PlateSection sx={{ display: "flex", gap: "8px" }}>
        <Button variant="outlined" onClick={onBack}>{Locale.label("mobile.components.back")}</Button>
        <Button variant="outlined" fullWidth onClick={() => onSelected(null)} data-testid="checkin-none-button">
          {Locale.label("mobile.screens.noGroup")}
        </Button>
      </PlateSection>
    </>
  );
};

const HouseholdStep = ({
  onShowGroups,
  onComplete,
  onBack
}: {
  onShowGroups: (member: PersonInterface, time: ServiceTimeInterface) => void;
  onComplete: (securityCode?: string) => void;
  onBack: () => void;
}) => {
  const [selectedMember, setSelectedMember] = useState<PersonInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [error, setError] = useState("");
  const [duplicateNames, setDuplicateNames] = useState<string[]>([]);

  const isCheckedIn = (personId: string): boolean => {
    const visit = CheckinHelper.getVisitByPersonId(CheckinHelper.existingVisits, personId);
    return !!(visit && visit.id);
  };

  const selectServiceTime = (member: PersonInterface, st: ServiceTimeInterface) => {
    CheckinHelper.selectedServiceTime = st;
    onShowGroups(member, st);
  };

  const changeMember = (member: PersonInterface) => {
    const times = CheckinHelper.serviceTimes || [];
    if (times.length === 1) selectServiceTime(member, times[0]);
    else setSelectedMember(member);
  };

  const renderServiceTime = (member: PersonInterface, st: ServiceTimeInterface, visitSessions: VisitSessionInterface[]) => {
    const stSessions = ArrayHelper.getAll(visitSessions, "session.serviceTimeId", st.id);
    let selectedGroupName = Locale.label("mobile.screens.noGroupSelected");
    let hasSelection = false;
    if (stSessions.length > 0) {
      const groupId = stSessions[0].session?.groupId || "";
      const validGroups = (st.groups || []).filter((g) => g != null);
      const group: GroupInterface = ArrayHelper.getOne(validGroups, "id", groupId);
      selectedGroupName = group?.name || Locale.label("mobile.screens.none");
      hasSelection = true;
    }

    return (
      <Row
        key={st.id}
        title={st.name}
        subtitle={selectedGroupName}
        sx={{ minHeight: 48 }}
        trailing={
          <TextLink onClick={() => selectServiceTime(member, st)} data-testid={`service-time-${st.id}`}>
            {hasSelection ? Locale.label("mobile.screens.change") : Locale.label("mobile.screens.selectGroup")}
          </TextLink>
        }
      />
    );
  };

  const renderMember = (member: PersonInterface) => {
    const isExpanded = selectedMember?.id === member.id;
    const visit = ArrayHelper.getOne(CheckinHelper.pendingVisits, "personId", member.id);
    const visitSessions: VisitSessionInterface[] = visit?.visitSessions || [];
    const selected = visitSessions.length > 0;
    const multipleTimes = (CheckinHelper.serviceTimes || []).length > 1;

    return (
      <Box key={member.id} className="kit-row" sx={{ py: "6px", "& + .kit-row": { borderTop: `1px solid ${tc.border}` } }}>
        <Box
          component="button"
          type="button"
          onClick={() => setSelectedMember(isExpanded ? null : member)}
          data-testid={`select-member-${member.id}`}
          aria-expanded={isExpanded}
          sx={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", minHeight: 48, py: "6px", px: 0, bgcolor: "transparent", border: 0, font: "inherit", textAlign: "left", cursor: "pointer", "&:focus-visible": { outline: `2px solid ${tc.primary}`, outlineOffset: -2 } }}
        >
          <Box
            component="span"
            aria-hidden
            sx={{ width: 22, height: 22, borderRadius: "5px", flex: "none", display: "grid", placeItems: "center", border: selected ? 0 : `1px solid ${tc.control}`, bgcolor: selected ? tc.selected : "transparent", color: tc.onSelected }}
          >
            {selected && <CheckIcon sx={{ fontSize: 16 }} />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="span" sx={{ display: "block", fontSize: 15, lineHeight: "21px", fontWeight: 500, color: tc.text }}>{member.name?.display}</Typography>
            {!selected && !isExpanded && (
              <Typography component="span" sx={{ display: "block", fontSize: 13.5, color: tc.textSecondary }}>{Locale.label("mobile.screens.tapToSelectGroups")}</Typography>
            )}
          </Box>
          {isCheckedIn(member.id!) && <StatusBadge tone="ok" dot>{Locale.label("mobile.screens.alreadyCheckedIn")}</StatusBadge>}
        </Box>
        {selected && !isExpanded && (
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", pl: "34px", pb: "8px" }}>
            <PillRow>
              {visitSessions.map((vs) => {
                const { group, time } = sessionGroupName(vs);
                return (
                  <Pill key={vs.id?.toString() || `${vs.session?.serviceTimeId}-${vs.session?.groupId}`} qualifier={multipleTimes && time ? `· ${time}` : undefined}>
                    {group}
                  </Pill>
                );
              })}
            </PillRow>
            <TextLink onClick={() => changeMember(member)}>{Locale.label("mobile.screens.change")}</TextLink>
          </Box>
        )}
        {isExpanded && (
          <Box sx={{ pl: "34px", pb: "6px" }}>
            <RowList>{CheckinHelper.serviceTimes?.map((st) => renderServiceTime(member, st, visitSessions))}</RowList>
          </Box>
        )}
      </Box>
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
    setError("");
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
      .then((data) => onComplete(typeof data?.securityCode === "string" ? data.securityCode : undefined))
      .catch((e) => setError(checkinErrorLabel(e)))
      .finally(() => setIsLoading(false));
  };

  const existingCode = (CheckinHelper.existingVisits as VisitWithCode[])?.find(
    (v) => !!v.securityCode
  )?.securityCode;

  if (isLoading) {
    return (
      <PlateSection>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      </PlateSection>
    );
  }

  const selectedCount = CheckinHelper.pendingVisits.filter((pv) => (pv.visitSessions?.length || 0) > 0).length;
  const submitLabel = selectedCount === 0
    ? Locale.label("mobile.screens.completeCheckin")
    : selectedCount === 1
      ? Locale.label("mobile.serving.checkInOne")
      : Locale.label("mobile.serving.checkInPeople").replace("{}", String(selectedCount));

  return (
    <>
      <PlateSection
        title={Locale.label("mobile.serving.whosHere")}
        action={existingCode ? (
          <TextLink onClick={() => onComplete(existingCode)} data-testid="checkin-show-code-button">
            <QrCode2Icon sx={{ fontSize: 18 }} />{Locale.label("mobile.screens.showCheckinCode")}
          </TextLink>
        ) : undefined}
      >
        <Intro>{Locale.label("mobile.screens.selectGroupsSubtitle")}</Intro>
        {error && <Notice tone="error">{error}</Notice>}
        {!CheckinHelper.householdMembers || CheckinHelper.householdMembers.length === 0 ? (
          <QuietEmpty>{Locale.label("mobile.screens.noHouseholdMessage")}</QuietEmpty>
        ) : (
          <Box>{CheckinHelper.householdMembers.map((m) => renderMember(m))}</Box>
        )}
      </PlateSection>

      <PlateSection sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button fullWidth variant="contained" size="large" onClick={handleCheckin} data-testid="checkin-submit-button">
          {submitLabel}
        </Button>
        <Button fullWidth variant="outlined" onClick={onBack}>{Locale.label("mobile.components.back")}</Button>
      </PlateSection>

      <Sheet
        open={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        title={Locale.label("mobile.screens.alreadyCheckedIn")}
        maxWidth="xs"
        actions={<>
          <Button variant="outlined" onClick={() => setShowDuplicateDialog(false)}>{Locale.label("mobile.screens.cancel")}</Button>
          <Button variant="contained" onClick={doCheckin}>{Locale.label("mobile.screens.checkInAgain")}</Button>
        </>}
      >
        <Typography>{Locale.label("mobile.screens.alreadyCheckedInBody").replace("{}", duplicateNames.join(", "))}</Typography>
      </Sheet>
    </>
  );
};

const CompleteStep = ({ securityCode, onDone }: { securityCode?: string; onDone: () => void }) => {
  useEffect(() => {
    if (securityCode) return undefined;
    const id = setTimeout(() => onDone(), 1500);
    return () => clearTimeout(id);
  }, [securityCode, onDone]);

  const placements = (CheckinHelper.pendingVisits || [])
    .filter((pv) => (pv.visitSessions?.length || 0) > 0)
    .map((pv) => {
      const person = (CheckinHelper.householdMembers || []).find((m) => m.id === pv.personId);
      const where = (pv.visitSessions || []).map((vs) => {
        const { group, time } = sessionGroupName(vs);
        return time ? `${group} · ${time}` : group;
      }).join(", ");
      return { id: pv.personId || "", name: person?.name?.display || "", where };
    })
    .filter((p) => p.name);

  return (
    <>
      {securityCode && (
        <PlateSection sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", py: "24px" }}>
          {/* QR codes need a light quiet zone to scan, even in dark mode. */}
          <Box sx={{ border: `1px solid ${tc.border}`, borderRadius: "10px", p: "16px", bgcolor: "#FFFFFF", lineHeight: 0 }}>
            <QRCodeSVG value={securityCode} size={184} data-testid="checkin-qr-code" />
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: 12, fontWeight: 650, letterSpacing: "0.07em", textTransform: "uppercase", color: tc.textSecondary }}>
              {Locale.label("mobile.serving.securityCode")}
            </Typography>
            <Typography sx={{ fontSize: 40, lineHeight: "48px", fontWeight: 650, letterSpacing: "0.12em", fontVariantNumeric: "tabular-nums", color: tc.text }}>
              {securityCode}
            </Typography>
          </Box>
        </PlateSection>
      )}
      {placements.length > 0 && (
        <PlateSection title={Locale.label("mobile.serving.whereEveryoneIs")}>
          <RowList>{placements.map((p) => <Row key={p.id} title={p.name} subtitle={p.where} />)}</RowList>
        </PlateSection>
      )}
      {securityCode ? (
        <PlateSection>
          <Button fullWidth variant="contained" size="large" onClick={onDone}>{Locale.label("mobile.screens.done")}</Button>
        </PlateSection>
      ) : placements.length === 0 && (
        <PlateSection><QuietEmpty>{Locale.label("mobile.screens.attendanceSaved")}</QuietEmpty></PlateSection>
      )}
    </>
  );
};

export const CheckinPage = ({ config: _config }: Props) => {
  const context = useContext(UserContext);
  const [step, setStep] = useState<Step>("services");
  const [groupsMember, setGroupsMember] = useState<PersonInterface | null>(null);
  const [groupsTime, setGroupsTime] = useState<ServiceTimeInterface | null>(null);
  const [securityCode, setSecurityCode] = useState<string>("");

  const handleCompleteDone = useCallback(() => {
    CheckinHelper.clearData();
    setGroupsMember(null);
    setGroupsTime(null);
    setSecurityCode("");
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

  if (!context?.user?.firstName) {
    return (
      <Box>
        <PageHead title={Locale.label("mobile.screens.signInToCheckIn")} lede={Locale.label("mobile.screens.signInToCheckInMessage")}>
          <Button variant="contained" component={Link} href="/mobile/login?returnUrl=/mobile/checkin">
            {Locale.label("mobile.screens.signInToCheckInCta")}
          </Button>
        </PageHead>
      </Box>
    );
  }

  const stepNumber = step === "services" ? 1 : step === "household" ? 2 : 3;
  const stepName = step === "services"
    ? Locale.label("mobile.screens.stepService")
    : step === "household"
      ? Locale.label("mobile.screens.stepHousehold")
      : Locale.label("mobile.screens.stepGroups");

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
        onComplete={(code) => {
          setSecurityCode(code || "");
          setStep("complete");
        }}
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
    content = <CompleteStep securityCode={securityCode} onDone={handleCompleteDone} />;
  }

  const complete = step === "complete";
  const title = complete
    ? (securityCode ? Locale.label("mobile.screens.youreCheckedIn") : Locale.label("mobile.screens.checkinComplete"))
    : Locale.label("mobile.screenTitles.checkin");
  const lede = complete
    ? (securityCode ? Locale.label("mobile.screens.showCodeAtStation") : Locale.label("mobile.screens.attendanceSaved"))
    : <span data-testid="checkin-step-indicator">{Locale.label("mobile.screens.checkinStep").replace("{}", String(stepNumber)).replace("{}", stepName)}</span>;

  return (
    <Box>
      <PageHead title={title} lede={lede} />
      <Plate data-testid={complete ? "checkin-complete" : undefined}>{content}</Plate>
    </Box>
  );
};
