"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Avatar, Box, Button, CircularProgress, Typography } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { ApiHelper, ArrayHelper, DateHelper, Locale, PersonHelper } from "@churchapps/apphelper";
import type {
  AssignmentInterface,
  PersonInterface,
  PlanInterface,
  PlanItemInterface,
  PositionInterface,
  TimeInterface,
  VenuePlanItemsResponseInterface
} from "@churchapps/helpers";
import { LessonsContentProvider, PlanHelper } from "@churchapps/helpers";
import { getProvider, type ContentDownload, type InstructionItem, type IProvider, type Instructions } from "@churchapps/content-providers";
import { PlanItem as PlanItemRow } from "@/app/[sdSlug]/mobile/components/plans/PlanItem";
import { LessonPreview } from "@/app/[sdSlug]/mobile/components/plans/LessonPreview";
import { ExpandedLessonView } from "@/app/[sdSlug]/mobile/components/plans/ExpandedLessonView";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";
import { ConfirmDeclineSheet } from "../ConfirmDeclineSheet";
import { BackVerb, PageHead, Pill, PillRow, Plate, PlateSection, QuietEmpty, RecordLayout, Row, RowList, StatusBadge, TextLink, useSliceView, type BadgeTone } from "../kit";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

const formatServiceDate = (date?: Date | string) => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? DateHelper.toDate(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(DateHelper.locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return "";
  }
};

const formatDateTime = (date?: Date | string) => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString(DateHelper.locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
};

const formatTimeShort = (date?: Date | string) => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(DateHelper.locale, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
};

function findThumbnailRecursive(item: InstructionItem): string | undefined {
  if (item.thumbnail) return item.thumbnail;
  if (item.children) {
    for (const child of item.children) {
      const found = findThumbnailRecursive(child);
      if (found) return found;
    }
  }
  return undefined;
}

function instructionToPlanItem(item: InstructionItem, providerId?: string, providerPath?: string, pathIndices: number[] = []): PlanItemInterface {
  let itemType = item.itemType || "item";
  if (itemType === "section") itemType = "providerSection";
  else if (itemType === "action") itemType = "providerPresentation";
  else if (itemType === "file") itemType = "providerFile";

  const contentPath = pathIndices.length > 0 ? pathIndices.join(".") : undefined;
  const thumbnail = findThumbnailRecursive(item);

  return {
    itemType,
    relatedId: item.relatedId,
    label: item.label || "",
    description: (item as any).content,
    seconds: item.seconds ?? 0,
    providerId,
    providerPath,
    providerContentPath: contentPath,
    thumbnailUrl: thumbnail,
    children: item.children?.map((child, index) => instructionToPlanItem(child, providerId, providerPath, [...pathIndices, index]))
  };
}

export const PlanDetail = ({ id, config: _config }: Props) => {
  const tc = mobileTheme.colors;
  const userContext = useContext(UserContext);
  const queryClient = useQueryClient();

  const [view, setView] = useSliceView();
  const [orderView, setOrderView] = useState<"summary" | "teach">("summary");

  interface LessonPreviewResult extends VenuePlanItemsResponseInterface {
    instructions?: Instructions | null;
  }
  const isLoggedIn = !!userContext?.userChurch?.jwt;
  const myPersonId = userContext?.person?.id || userContext?.userChurch?.person?.id;

  interface PlanBundle {
    plan: PlanInterface | null;
    planItems: PlanItemInterface[];
    positions: PositionInterface[];
    assignments: AssignmentInterface[];
    times: TimeInterface[];
    people: PersonInterface[];
  }

  const queryKey = useMemo(() => ["plan-detail", id], [id]);

  const { data: planBundle, isLoading: loading } = useQuery<PlanBundle>({
    queryKey,
    queryFn: async () => {
      const [planRes, itemsRes, positionsRes, assignmentsRes, timesRes] = await Promise.all([
        ApiHelper.get(`/plans/${id}`, "DoingApi").catch((): null => null),
        ApiHelper.get(`/planItems/plan/${id}`, "DoingApi").catch((): any[] => []),
        ApiHelper.get(`/positions/plan/${id}`, "DoingApi").catch((): any[] => []),
        ApiHelper.get(`/assignments/plan/${id}`, "DoingApi").catch((): any[] => []),
        ApiHelper.get(`/times/plan/${id}`, "DoingApi").catch((): any[] => [])
      ]);
      if (!planRes || !planRes.id) {
        return { plan: null, planItems: [], positions: [], assignments: [], times: [], people: [] };
      }
      const peopleIds = ArrayHelper.getIds(Array.isArray(assignmentsRes) ? assignmentsRes : [], "personId");
      let peopleRes: PersonInterface[] = [];
      if (peopleIds.length > 0) {
        try {
          const raw = await ApiHelper.get(`/people/basic?ids=${encodeURIComponent(peopleIds.join(","))}`, "MembershipApi");
          if (Array.isArray(raw)) peopleRes = raw;
        } catch {
          peopleRes = [];
        }
      }
      return {
        plan: planRes,
        planItems: Array.isArray(itemsRes) ? itemsRes : [],
        positions: Array.isArray(positionsRes) ? positionsRes : [],
        assignments: Array.isArray(assignmentsRes) ? assignmentsRes : [],
        times: Array.isArray(timesRes) ? timesRes : [],
        people: peopleRes
      };
    },
    enabled: !!id && isLoggedIn
  });

  const plan = planBundle?.plan ?? null;
  const planItems = planBundle?.planItems ?? [];
  const positions = planBundle?.positions ?? [];
  const assignments = planBundle?.assignments ?? [];
  const times = planBundle?.times ?? [];
  const people = planBundle?.people ?? [];
  const notFound = !loading && planBundle !== undefined && !plan;

  const teamGroups = useMemo(() => {
    const groups: { category: string; positions: PositionInterface[] }[] = [];
    const categories = ArrayHelper.getUniqueValues(positions, "categoryName");
    categories.forEach((category: string) => {
      groups.push({
        category: category || Locale.label("mobile.details.team"),
        positions: ArrayHelper.getAll(positions, "categoryName", category)
      });
    });
    return groups;
  }, [positions]);

  const positionLabels = useMemo(() => {
    if (!plan?.showVolunteerNames) return {};
    const result: Record<string, string> = {};
    positions.forEach((p) => {
      const names = assignments
        .filter((a) => a.positionId === p.id)
        .map((a) => {
          const person = ArrayHelper.getOne(people, "id", a.personId) as PersonInterface | null;
          return person?.name?.display || [person?.name?.first, person?.name?.last].filter(Boolean).join(" ");
        })
        .filter(Boolean);
      if (p.id && names.length > 0) result[p.id] = names.join(", ");
    });
    return result;
  }, [plan?.showVolunteerNames, positions, assignments, people]);

  const myAssignments = useMemo(
    () => (myPersonId ? ArrayHelper.getAll(assignments, "personId", myPersonId) : []),
    [assignments, myPersonId]
  );

  const lessonsProvider = useMemo(() => new LessonsContentProvider(), []);
  const hasAssociatedLesson = !!plan && lessonsProvider.hasAssociatedLesson(plan);
  const externalRef = plan ? lessonsProvider.getExternalRef(plan) : null;
  const provider: IProvider | null = useMemo(() => {
    if (plan?.providerId) return getProvider(plan.providerId);
    return null;
  }, [plan?.providerId]);
  const hasAssociatedContent = !!provider || hasAssociatedLesson;

  const { data: lessonPreview } = useQuery<LessonPreviewResult>({
    queryKey: ["plan-preview", id, plan?.providerId, plan?.providerPlanId, plan?.contentType, plan?.contentId],
    queryFn: async () => {
      if (provider && plan?.providerPlanId) {
        let instructions: Instructions | null = null;
        if (!provider.requiresAuth && provider.capabilities.instructions && provider.getInstructions) {
          try { instructions = await provider.getInstructions(plan.providerPlanId); } catch { }
        }
        if (!instructions) {
          try {
            instructions = await ApiHelper.post(
              "/providerProxy/getInstructions",
              { ministryId: plan.ministryId, providerId: plan.providerId, path: plan.providerPlanId },
              "DoingApi"
            );
          } catch { }
        }
        if (instructions) {
          const items: PlanItemInterface[] = instructions.items.map((item, index) =>
            instructionToPlanItem(item, plan.providerId, plan.providerPlanId, [index]));
          return {
            items,
            venueName: plan.providerPlanName || instructions.name || "",
            instructions
          };
        }
      }
      if (plan && hasAssociatedLesson) {
        try {
          const legacy = await lessonsProvider.fetchVenuePlanItems(plan);
          return { ...legacy, instructions: null };
        } catch {
          return { items: [], instructions: null };
        }
      }
      return { items: [], instructions: null };
    },
    // Provider instructions load even when the service order was customized (planItems exist) — downloads still belong to the associated lesson
    enabled: isLoggedIn && !!plan && hasAssociatedContent && (planItems.length === 0 || (!!provider && !!plan.providerPlanId))
  });
  const showPreviewMode = hasAssociatedContent && planItems.length === 0 && (lessonPreview?.items?.length ?? 0) > 0;
  const downloads: ContentDownload[] = lessonPreview?.instructions?.downloads ?? [];


  const refreshAssignments = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  if (!isLoggedIn) {
    return (
      <Box>
        <PageHead title={Locale.label("mobile.details.signInRequired")} lede={Locale.label("mobile.details.signInToViewPlan")}>
          <Button variant="contained" component={Link} href={`/mobile/login?returnUrl=${encodeURIComponent(`/mobile/plans/${id}`)}`}>
            {Locale.label("mobile.details.signIn")}
          </Button>
        </PageHead>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !plan) {
    return (
      <Box>
        <PageHead title={Locale.label("mobile.details.planNotAvailable")} lede={Locale.label("mobile.details.planRemoved")}>
          <TextLink href="/mobile/plans">{Locale.label("mobile.details.backToPlans")}</TextLink>
        </PageHead>
      </Box>
    );
  }

  const withStartTimes = (items: PlanItemInterface[]) => {
    let cumulative = 0;
    return items.map((pi) => {
      const startTime = cumulative;
      cumulative += pi.itemType === "header" ? PlanHelper.getSectionDuration(pi) : (pi.seconds || 0);
      return { pi, startTime };
    });
  };

  const leafItems: PlanItemInterface[] = [];
  const collectLeaves = (items: PlanItemInterface[]) => items.forEach((pi) => {
    if (pi.itemType === "header") collectLeaves(pi.children || []);
    else leafItems.push(pi);
  });
  collectLeaves(planItems);

  const renderPlanItems = (items: { pi: PlanItemInterface; startTime: number }[]) => items.map(({ pi, startTime }) => (
    <PlanItemRow
      key={pi.id}
      planItem={pi}
      startTime={startTime}
      associatedProviderId={plan.providerId}
      associatedVenueId={plan.providerPlanId}
      ministryId={plan.ministryId}
      positionLabels={positionLabels}
    />
  ));

  const renderLessonPreview = (items: PlanItemInterface[]) => (
    <LessonPreview
      lessonItems={items}
      venueName={lessonPreview?.venueName || ""}
      externalRef={externalRef}
      associatedProviderId={plan.providerId}
      associatedVenueId={plan.providerPlanId}
      ministryId={plan.ministryId}
    />
  );

  const members: { id?: string; positionId?: string; name: string; position: string; photo?: string }[] = [];
  teamGroups.forEach((g) => g.positions.forEach((position) => {
    ArrayHelper.getAll(assignments, "positionId", position.id).forEach((a: AssignmentInterface) => {
      const person = ArrayHelper.getOne(people, "id", a.personId) as PersonInterface | null;
      if (!person) return;
      members.push({
        id: a.id,
        positionId: position.id,
        name: person.name?.display || [person.name?.first, person.name?.last].filter(Boolean).join(" ") || Locale.label("mobile.components.unknown"),
        position: position.name || Locale.label("mobile.details.position"),
        photo: person.photo ? PersonHelper.getPhotoUrl(person) : undefined
      });
    });
  }));

  const backToPlan = <BackVerb label={Locale.label("mobile.serving.backTo").replace("{}", plan.name || "")} onClick={() => setView("")} />;

  const teach = lessonPreview?.instructions && (
    <ExpandedLessonView
      open={orderView === "teach"}
      onClose={() => setOrderView("summary")}
      instructions={lessonPreview.instructions}
      lessonName={lessonPreview.venueName || ""}
    />
  );

  if (view === "order") {
    return (
      <Box>
        {backToPlan}
        <PageHead title={Locale.label("mobile.details.tabServiceOrder")} lede={formatServiceDate(plan.serviceDate)} />
        <Plate>
          <PlateSection>
            {planItems.length > 0
              ? renderPlanItems(withStartTimes(planItems))
              : showPreviewMode && lessonPreview?.items
                ? renderLessonPreview(lessonPreview.items)
                : <QuietEmpty>{Locale.label("mobile.details.noOrderItems")}</QuietEmpty>}
          </PlateSection>
        </Plate>
        {teach}
      </Box>
    );
  }

  if (view === "teams") {
    return (
      <Box>
        {backToPlan}
        <PageHead title={Locale.label("mobile.details.tabTeams")} lede={formatServiceDate(plan.serviceDate)} />
        <Plate>
          {teamGroups.length === 0 ? (
            <PlateSection><QuietEmpty>{Locale.label("mobile.details.noTeamsAssigned")}</QuietEmpty></PlateSection>
          ) : teamGroups.map((group) => {
            const groupMembers = members.filter((m) => group.positions.some((p) => p.id === m.positionId));
            return (
              <PlateSection key={group.category} title={group.category} action={<StatusBadge tone="neu">{groupMembers.length}</StatusBadge>}>
                {groupMembers.length === 0 ? (
                  <QuietEmpty>{Locale.label("mobile.details.noAssignedMembers")}</QuietEmpty>
                ) : (
                  <RowList>
                    {groupMembers.map((m) => (
                      <Row
                        key={m.id || `${m.name}-${m.position}`}
                        leading={<Avatar src={m.photo} alt="" sx={{ width: 40, height: 40, fontSize: 15, bgcolor: tc.chip, color: tc.onChip }}>{m.name[0]?.toUpperCase() || "?"}</Avatar>}
                        title={m.name}
                        subtitle={m.position}
                      />
                    ))}
                  </RowList>
                )}
              </PlateSection>
            );
          })}
        </Plate>
      </Box>
    );
  }

  const orderTeaser = planItems.length > 0
    ? renderPlanItems(withStartTimes(leafItems).slice(0, 5))
    : showPreviewMode && lessonPreview?.items
      ? renderLessonPreview(lessonPreview.items.slice(0, 3))
      : null;
  const orderCount = planItems.length > 0 ? leafItems.length : (lessonPreview?.items?.length ?? 0);

  const identity = (
    <PageHead title={plan.name} lede={formatServiceDate(plan.serviceDate)}>
      {showPreviewMode && lessonPreview?.instructions && (
        <Button variant="contained" startIcon={<SchoolIcon />} onClick={() => setOrderView("teach")}>
          {Locale.label("mobile.details.viewTeach")}
        </Button>
      )}
    </PageHead>
  );

  return (
    <Box>
      <RecordLayout identity={identity}>
        <Plate>
          <PlateSection title={Locale.label("mobile.serving.yourAssignment")}>
            {myAssignments.length === 0 ? (
              <QuietEmpty>{Locale.label("mobile.details.noAssignmentsForPlan")}</QuietEmpty>
            ) : myAssignments.map((assignment) => {
              const position = ArrayHelper.getOne(positions, "id", assignment.positionId) as PositionInterface | null;
              const posTimes = (times || []).filter(
                (t: any) => position?.categoryName && typeof t?.teams === "string" && t.teams.indexOf(position.categoryName) > -1
              );
              return (
                <AssignmentBlock
                  key={assignment.id}
                  position={position}
                  assignment={assignment}
                  times={posTimes}
                  onUpdate={refreshAssignments}
                />
              );
            })}
          </PlateSection>

          <PlateSection
            title={Locale.label("mobile.details.tabServiceOrder")}
            action={orderTeaser ? <TextLink onClick={() => setView("order")}>{Locale.label("mobile.serving.fullServiceOrder")}</TextLink> : undefined}
          >
            {orderTeaser || <QuietEmpty>{Locale.label("mobile.details.noOrderItems")}</QuietEmpty>}
            {orderTeaser && orderCount > 0 && (
              <Typography sx={{ mt: "6px", fontSize: 13.5, color: tc.textSecondary }}>
                {Locale.label("mobile.serving.itemsCount").replace("{}", String(orderCount))}
              </Typography>
            )}
          </PlateSection>

          <PlateSection
            title={Locale.label("mobile.details.tabTeams")}
            action={teamGroups.length > 0 ? <TextLink onClick={() => setView("teams")}>{Locale.label("mobile.serving.allTeams")}</TextLink> : undefined}
          >
            {members.length === 0 ? (
              <QuietEmpty>{Locale.label("mobile.details.noTeamsAssigned")}</QuietEmpty>
            ) : (
              <>
                <PillRow>
                  {members.slice(0, 8).map((m) => <Pill key={m.id || `${m.name}-${m.position}`} qualifier={`· ${m.position}`}>{m.name}</Pill>)}
                </PillRow>
                <Typography sx={{ mt: "10px", fontSize: 13.5, color: tc.textSecondary }}>
                  {Locale.label("mobile.serving.servingCount").replace("{}", String(members.length))}
                  {" · "}
                  {Locale.label("mobile.serving.teamsCount").replace("{}", String(teamGroups.length))}
                </Typography>
              </>
            )}
          </PlateSection>

          {plan.notes && (
            <PlateSection title={Locale.label("mobile.details.planNotes")}>
              <Typography sx={{ fontSize: 15, lineHeight: "22px", color: tc.text, whiteSpace: "pre-line" }}>{plan.notes}</Typography>
            </PlateSection>
          )}

          {downloads.length > 0 && (
            <PlateSection title={Locale.label("mobile.details.downloads")}>
              <Box data-testid="plan-downloads">
                {downloads.map((d, idx) => (
                  <Box
                    key={d.id || `${d.url}-${idx}`}
                    component="a"
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ display: "flex", alignItems: "center", gap: "12px", minHeight: 48, color: tc.link, fontWeight: 600, fontSize: 15, textDecoration: "none", "& + a": { borderTop: `1px solid ${tc.border}` }, "&:hover": { textDecoration: "underline" } }}
                  >
                    <DescriptionOutlinedIcon sx={{ fontSize: 20, color: tc.textSecondary }} />
                    {d.title}
                  </Box>
                ))}
              </Box>
            </PlateSection>
          )}
        </Plate>
      </RecordLayout>
      {teach}
    </Box>
  );
};

const statusMeta = (status?: string): { label: string; tone: BadgeTone } => {
  switch ((status || "").toLowerCase()) {
    case "accepted": return { label: Locale.label("mobile.details.accepted"), tone: "ok" };
    case "confirmed": return { label: Locale.label("mobile.details.confirmed"), tone: "ok" };
    case "declined": return { label: Locale.label("mobile.details.declined"), tone: "bad" };
    case "":
    case "unconfirmed": return { label: Locale.label("mobile.serving.needsReplyBadge"), tone: "warn" };
    default: return { label: Locale.label("mobile.details.pendingResponse"), tone: "warn" };
  }
};

const AssignmentBlock = ({
  position,
  assignment,
  times,
  onUpdate
}: {
  position: PositionInterface | null;
  assignment: AssignmentInterface;
  times: TimeInterface[];
  onUpdate: () => void;
}) => {
  const tc = mobileTheme.colors;
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);

  useEffect(() => { setErrorMessage(null); }, [assignment?.status]);

  if (!position || !assignment) return null;

  const meta = statusMeta(assignment.status);

  const sortedTimes = [...times].sort((a: any, b: any) => (a?.startTime > b?.startTime ? 1 : -1));

  let latestBoundary: Date | null = null;
  sortedTimes.forEach((t: any) => {
    const raw = t?.endTime || t?.startTime;
    if (!raw) return;
    const boundary = new Date(raw);
    if (isNaN(boundary.getTime())) return;
    if (!latestBoundary || boundary > latestBoundary) latestBoundary = boundary;
  });
  const beforeService = !latestBoundary || new Date() < (latestBoundary as Date);
  const canRespond = assignment.status === "Unconfirmed" && beforeService;
  const canWithdraw = assignment.status === "Accepted" && beforeService;
  const canReaccept = assignment.status === "Declined" && beforeService;

  const handleRespond = async (action: "accept" | "decline") => {
    if (!assignment.id || busy) return;
    setBusy(true);
    setErrorMessage(null);
    try {
      await ApiHelper.post(`/assignments/${action}/${assignment.id}`, [], "DoingApi");
      onUpdate();
    } catch (err: any) {
      console.error(`Error ${action}ing assignment:`, err);
      setErrorMessage(err?.message || Locale.label("mobile.details.unableToRespond").replace("{}", action));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ "& + &": { borderTop: `1px solid ${tc.border}`, pt: "16px", mt: "16px" } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h3" sx={{ fontSize: 17, lineHeight: "24px", fontWeight: 600, color: tc.text }}>
            {position.name || Locale.label("mobile.details.position")}
          </Typography>
          {position.categoryName && <Typography sx={{ fontSize: 13.5, color: tc.textSecondary }}>{position.categoryName}</Typography>}
        </Box>
        <StatusBadge tone={meta.tone} dot={meta.tone === "ok"}>{meta.label}</StatusBadge>
      </Box>

      {sortedTimes.length > 0 && (
        <Box sx={{ mt: "10px" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: tc.textSecondary }}>{Locale.label("mobile.details.serviceTimes")}</Typography>
          {sortedTimes.map((time) => (
            <Typography key={time.id} sx={{ fontSize: 14, color: tc.text, mt: "2px" }}>
              {time.displayName || Locale.label("mobile.details.service")}
              <Box component="span" sx={{ color: tc.textSecondary }}>
                {" · "}{formatDateTime(time.startTime)}{time.endTime ? ` – ${formatTimeShort(time.endTime)}` : ""}
              </Box>
            </Typography>
          ))}
        </Box>
      )}

      {canRespond && (
        <Box sx={{ display: "flex", gap: "8px", mt: "14px" }}>
          <Button variant="contained" size="small" onClick={() => handleRespond("accept")} disabled={busy}>{Locale.label("mobile.details.accept")}</Button>
          <Button variant="outlined" size="small" onClick={() => setConfirmDecline(true)} disabled={busy}>{Locale.label("mobile.details.decline")}</Button>
        </Box>
      )}

      {canWithdraw && (
        <Box sx={{ mt: "12px" }}>
          <TextLink danger onClick={() => setConfirmDecline(true)} disabled={busy}>{Locale.label("mobile.details.decline")}</TextLink>
        </Box>
      )}

      {canReaccept && (
        <Box sx={{ mt: "12px" }}>
          <TextLink onClick={() => handleRespond("accept")} disabled={busy}>{Locale.label("mobile.details.accept")}</TextLink>
        </Box>
      )}

      <ConfirmDeclineSheet open={confirmDecline} onClose={() => setConfirmDecline(false)} onConfirm={() => handleRespond("decline")} />

      {errorMessage && <Typography role="alert" sx={{ fontSize: 13, color: tc.error, mt: "8px" }}>{errorMessage}</Typography>}
    </Box>
  );
};

export default PlanDetail;
