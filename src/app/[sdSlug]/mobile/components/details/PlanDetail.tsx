"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Icon,
  IconButton,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ApiHelper, ArrayHelper, Locale } from "@churchapps/apphelper";
import type {
  AssignmentInterface,
  PersonInterface,
  PlanInterface,
  PlanItemInterface,
  PositionInterface,
  TimeInterface,
  VenuePlanItemsResponseInterface
} from "@churchapps/helpers";
import { LessonsContentProvider } from "@churchapps/helpers";
import { getProvider, type InstructionItem, type IProvider, type Instructions } from "@churchapps/content-providers";
import { PlanItem as PlanItemRow } from "@/app/[sdSlug]/mobile/components/plans/PlanItem";
import { LessonPreview } from "@/app/[sdSlug]/mobile/components/plans/LessonPreview";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

const formatServiceDate = (date?: Date | string) => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
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
    return d.toLocaleString(undefined, {
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
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
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
  const router = useRouter();
  const userContext = useContext(UserContext);
  const queryClient = useQueryClient();

  type TabKey = "overview" | "order" | "team";
  const [tab, setTab] = useState<TabKey>("overview");
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

  const { data: lessonPreview } = useQuery<VenuePlanItemsResponseInterface>({
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
              { providerId: plan.providerId, path: plan.providerPlanId },
              "DoingApi"
            );
          } catch { }
        }
        if (instructions) {
          const items: PlanItemInterface[] = instructions.items.map((item, index) =>
            instructionToPlanItem(item, plan.providerId, plan.providerPlanId, [index]));
          return { items, venueName: plan.providerPlanName || instructions.name || "" };
        }
      }
      if (plan && hasAssociatedLesson) {
        try {
          return await lessonsProvider.fetchVenuePlanItems(plan);
        } catch {
          return { items: [] };
        }
      }
      return { items: [] };
    },
    enabled: isLoggedIn && !!plan && hasAssociatedContent && planItems.length === 0
  });
  const showPreviewMode = hasAssociatedContent && planItems.length === 0 && (lessonPreview?.items?.length ?? 0) > 0;

  const refreshAssignments = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const BackButton = (
    <IconButton
      onClick={() => router.push("/mobile/plans")}
      aria-label={Locale.label("mobile.components.back")}
      sx={{
        color: tc.primary,
        bgcolor: tc.surface,
        width: 40,
        height: 40,
        boxShadow: mobileTheme.shadows.sm,
        "&:hover": { bgcolor: tc.surfaceVariant }
      }}
    >
      <ArrowBackIcon sx={{ fontSize: 24 }} />
    </IconButton>
  );

  const OuterShell = ({ children }: { children: React.ReactNode }) => (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ mb: `${mobileTheme.spacing.md}px` }}>{BackButton}</Box>
      {children}
    </Box>
  );

  if (!isLoggedIn) {
    return (
      <OuterShell>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
            mt: 4
          }}
        >
          <Icon sx={{ fontSize: 56, color: tc.textSecondary, mb: 1 }}>lock</Icon>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            {Locale.label("mobile.details.signInRequired")}
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            {Locale.label("mobile.details.signInToViewPlan")}
          </Typography>
          <Link
            href={`/login/?returnUrl=/mobile/plans/${id}`}
            style={{ color: tc.primary, fontWeight: 600, textDecoration: "none" }}
          >
            {Locale.label("mobile.details.signIn")}
          </Link>
        </Box>
      </OuterShell>
    );
  }

  if (loading) {
    return (
      <OuterShell>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <CircularProgress sx={{ color: tc.primary }} />
        </Box>
      </OuterShell>
    );
  }

  if (notFound || !plan) {
    return (
      <OuterShell>
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.lg}px`,
            textAlign: "center",
            mt: 4
          }}
        >
          <Icon sx={{ fontSize: 56, color: tc.textSecondary, mb: 1 }}>event_busy</Icon>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            {Locale.label("mobile.details.planNotAvailable")}
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            {Locale.label("mobile.details.planRemoved")}
          </Typography>
          <Link href="/mobile/plans" style={{ color: tc.primary, fontWeight: 600, textDecoration: "none" }}>
            {Locale.label("mobile.details.backToPlans")}
          </Link>
        </Box>
      </OuterShell>
    );
  }

  const headerCard = (
    <Box
      sx={{
        borderRadius: `${mobileTheme.radius.xl}px`,
        boxShadow: mobileTheme.shadows.md,
        p: `${mobileTheme.spacing.lg}px`,
        mb: `${mobileTheme.spacing.lg}px`,
        background: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        color: "#FFFFFF",
        textAlign: "center",
        minHeight: 140,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Icon sx={{ fontSize: 48, color: "#FFFFFF", mb: 1.5 }}>assignment</Icon>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", textAlign: "center", mb: 1 }}>
          {plan.name}
        </Typography>
        {plan.serviceDate ? (
          <Typography sx={{ fontSize: 16, fontWeight: 500, color: "#FFFFFF", opacity: 0.9 }}>
            {formatServiceDate(plan.serviceDate)}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );

  const planItemsWithStartTime = (() => {
    let cumulativeTime = 0;
    return planItems.map((pi) => {
      const startTime = cumulativeTime;
      cumulativeTime += pi.seconds || 0;
      return { pi, startTime };
    });
  })();

  return (
    <Box sx={{ p: `${mobileTheme.spacing.md}px`, bgcolor: tc.background, minHeight: "100%" }}>
      <Box sx={{ mb: `${mobileTheme.spacing.md}px` }}>{BackButton}</Box>
      {headerCard}

      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          mb: `${mobileTheme.spacing.md}px`,
          overflow: "hidden"
        }}
      >
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          TabIndicatorProps={{ sx: { backgroundColor: tc.primary, height: 2 } }}
          sx={{
            minHeight: 52,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              color: tc.textSecondary,
              minHeight: 52
            },
            "& .Mui-selected": { color: `${tc.primary} !important`, fontWeight: 700 }
          }}
        >
          <Tab value="overview" label={Locale.label("mobile.details.tabOverview")} />
          <Tab value="order" label={Locale.label("mobile.details.tabServiceOrder")} />
          <Tab value="team" label={Locale.label("mobile.details.tabTeams")} />
        </Tabs>
      </Box>

      {tab === "overview" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>

          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: `${mobileTheme.spacing.md}px`,
                py: `${mobileTheme.spacing.md}px`,
                borderRadius: `${mobileTheme.radius.lg}px`,
                bgcolor: `${tc.primary}14`,
                mb: `${mobileTheme.spacing.md}px`
              }}
            >
              <Icon sx={{ color: tc.primary, fontSize: 24 }}>assignment_ind</Icon>
              <Typography sx={{ flex: 1, fontSize: 18, fontWeight: 700, color: tc.primary, ml: 0.5 }}>
                {Locale.label("mobile.details.myAssignments")}
              </Typography>
              <Box
                sx={{
                  bgcolor: tc.primary,
                  color: "#FFFFFF",
                  borderRadius: "16px",
                  fontSize: 14,
                  fontWeight: 700,
                  px: 1.5,
                  py: 0.75,
                  minWidth: 32,
                  textAlign: "center"
                }}
              >
                {myAssignments.length}
              </Box>
            </Box>

            {myAssignments.length === 0 ? (
              <Box
                sx={{
                  bgcolor: tc.surface,
                  borderRadius: `${mobileTheme.radius.lg}px`,
                  boxShadow: mobileTheme.shadows.sm,
                  p: `${mobileTheme.spacing.lg}px`,
                  textAlign: "center"
                }}
              >
                <Icon sx={{ fontSize: 48, color: tc.textSecondary, mb: 1 }}>assignment_late</Icon>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>
                  {Locale.label("mobile.details.noAssignmentsForPlan")}
                </Typography>
                <Typography sx={{ fontSize: 13, color: tc.textMuted, mt: 0.5 }}>
                  {Locale.label("mobile.details.checkWithLeader")}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
                {myAssignments.map((assignment) => {
                  const position = ArrayHelper.getOne(positions, "id", assignment.positionId) as PositionInterface | null;
                  const posTimes = (times || []).filter(
                    (t: any) => position?.categoryName && typeof t?.teams === "string" && t.teams.indexOf(position.categoryName) > -1
                  );
                  return (
                    <PositionDetailsCard
                      key={assignment.id}
                      position={position}
                      assignment={assignment}
                      times={posTimes}
                      onUpdate={refreshAssignments}
                    />
                  );
                })}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              p: `${mobileTheme.spacing.md}px`
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon sx={{ color: tc.primary }}>note</Icon>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text }}>{Locale.label("mobile.details.planNotes")}</Typography>
            </Box>
            {plan.notes ? (
              <Typography sx={{ fontSize: 14, color: tc.textSecondary, lineHeight: 1.5 }}>
                {plan.notes.replace(/\n/g, " ")}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 13, color: tc.textSecondary, fontStyle: "italic" }}>
                {Locale.label("mobile.details.noNotes")}
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {tab === "order" && (
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            boxShadow: mobileTheme.shadows.sm,
            p: `${mobileTheme.spacing.md}px`
          }}
        >
          {planItems.length === 0 && showPreviewMode && lessonPreview?.items ? (
            <LessonPreview
              lessonItems={lessonPreview.items}
              venueName={lessonPreview.venueName || ""}
              externalRef={externalRef}
              associatedProviderId={plan.providerId}
              associatedVenueId={plan.providerPlanId}
              ministryId={plan.ministryId}
            />
          ) : planItems.length === 0 ? (
            <Typography sx={{ fontSize: 14, color: tc.textMuted, textAlign: "center", py: 2 }}>
              {Locale.label("mobile.details.noOrderItems")}
            </Typography>
          ) : (
            <Box>
              {planItemsWithStartTime.map(({ pi, startTime }) => (
                <PlanItemRow
                  key={pi.id}
                  planItem={pi}
                  startTime={startTime}
                  associatedProviderId={plan.providerId}
                  associatedVenueId={plan.providerPlanId}
                  ministryId={plan.ministryId}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {tab === "team" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
          {teamGroups.length === 0 ? (
            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                boxShadow: mobileTheme.shadows.sm,
                p: `${mobileTheme.spacing.lg}px`,
                textAlign: "center"
              }}
            >
              <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
                {Locale.label("mobile.details.noTeamsAssigned")}
              </Typography>
            </Box>
          ) : (
            teamGroups.map((group) => (
              <TeamGroupCard
                key={group.category}
                category={group.category}
                positions={group.positions}
                assignments={assignments}
                people={people}
              />
            ))
          )}
        </Box>
      )}

    </Box>
  );
};

const statusMeta = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "accepted": return { label: Locale.label("mobile.details.accepted"), color: mobileTheme.colors.success, icon: "check_circle" };
    case "confirmed": return { label: Locale.label("mobile.details.confirmed"), color: mobileTheme.colors.success, icon: "check_circle" };
    case "declined": return { label: Locale.label("mobile.details.declined"), color: mobileTheme.colors.error, icon: "cancel" };
    default: return { label: Locale.label("mobile.details.pendingResponse"), color: mobileTheme.colors.warning, icon: "schedule" };
  }
};

const PositionDetailsCard = ({
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

  useEffect(() => { setErrorMessage(null); }, [assignment?.status]);

  if (!position || !assignment) return null;

  const meta = statusMeta(assignment.status);

  const sortedTimes = [...times].sort((a: any, b: any) => (a?.startTime > b?.startTime ? 1 : -1));
  let latestEnd = new Date();
  sortedTimes.forEach((t: any) => {
    if (t?.endTime && new Date(t.endTime) > latestEnd) latestEnd = new Date(t.endTime);
  });
  const canRespond = assignment.status === "Unconfirmed" && (sortedTimes.length === 0 || new Date() < latestEnd);

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
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Icon sx={{ color: tc.primary }}>assignment_ind</Icon>
        <Typography sx={{ flex: 1, fontSize: 16, fontWeight: 700, color: tc.text }}>
          {position.name || Locale.label("mobile.details.position")}
        </Typography>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: meta.color,
            color: "#FFFFFF",
            borderRadius: "999px",
            px: 1.25,
            py: 0.25,
            fontSize: 12,
            fontWeight: 600
          }}
        >
          <Icon sx={{ fontSize: 14, color: "#FFFFFF" }}>{meta.icon}</Icon>
          <span>{meta.label}</span>
        </Box>
      </Box>

      {sortedTimes.length > 0 && (
        <Box sx={{ mt: 1.25 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: tc.textMuted, mb: 0.75 }}>
            {Locale.label("mobile.details.serviceTimes")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {sortedTimes.map((time) => (
              <Box
                key={time.id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  p: 1,
                  borderRadius: `${mobileTheme.radius.md}px`,
                  bgcolor: `${tc.primary}0D`
                }}
              >
                <Icon sx={{ color: tc.primary, fontSize: 18, mt: 0.25 }}>access_time</Icon>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>
                    {time.displayName || Locale.label("mobile.details.service")}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: tc.textMuted }}>
                    {formatDateTime(time.startTime)}{time.endTime ? ` - ${formatTimeShort(time.endTime)}` : ""}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {canRespond && (
        <Box sx={{ display: "flex", gap: 1, mt: `${mobileTheme.spacing.md}px` }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Icon>close</Icon>}
            onClick={() => handleRespond("decline")}
            disabled={busy}
            sx={{ flex: 1, textTransform: "none", fontWeight: 600 }}
          >
            {Locale.label("mobile.details.decline")}
          </Button>
          <Button
            variant="contained"
            startIcon={<Icon>check</Icon>}
            onClick={() => handleRespond("accept")}
            disabled={busy}
            sx={{
              flex: 1,
              textTransform: "none",
              fontWeight: 600,
              bgcolor: tc.success,
              "&:hover": { bgcolor: tc.success, filter: "brightness(0.95)" }
            }}
          >
            {Locale.label("mobile.details.accept")}
          </Button>
        </Box>
      )}

      {errorMessage && (
        <Typography sx={{ fontSize: 12, color: tc.error, mt: 1 }}>
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};

const TeamGroupCard = ({
  category,
  positions,
  assignments,
  people
}: {
  category: string;
  positions: PositionInterface[];
  assignments: AssignmentInterface[];
  people: PersonInterface[];
}) => {
  const tc = mobileTheme.colors;

  const members: { id?: string; personId?: string; name: string; position: string; photo?: string }[] = [];
  positions.forEach((position) => {
    const posAssignments = ArrayHelper.getAll(assignments, "positionId", position.id);
    posAssignments.forEach((a: AssignmentInterface) => {
      const person = ArrayHelper.getOne(people, "id", a.personId) as PersonInterface | null;
      if (!person) return;
      const displayName =
        person.name?.display ||
        [person.name?.first, person.name?.last].filter(Boolean).join(" ") ||
        Locale.label("mobile.components.unknown");
      members.push({
        id: a.id,
        personId: person.id,
        name: displayName,
        position: position.name || Locale.label("mobile.details.position"),
        photo: person.photo
      });
    });
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: `${mobileTheme.spacing.md}px`,
          py: `${mobileTheme.spacing.sm}px`,
          bgcolor: `${tc.primary}0D`,
          borderRadius: `${mobileTheme.radius.lg}px`,
          mb: `${mobileTheme.spacing.sm}px`
        }}
      >
        <Icon sx={{ color: tc.primary, fontSize: 24, mr: 1 }}>group</Icon>
        <Typography sx={{ flex: 1, fontSize: 16, fontWeight: 700, color: tc.primary }}>
          {category}
        </Typography>
        <Box
          sx={{
            bgcolor: tc.primary,
            color: "#FFFFFF",
            borderRadius: "12px",
            px: 1,
            py: 0.5,
            fontSize: 12,
            fontWeight: 600,
            minWidth: 24,
            textAlign: "center"
          }}
        >
          {members.length}
        </Box>
      </Box>

      {members.length === 0 ? (
        <Box
          sx={{
            bgcolor: tc.surface,
            borderRadius: `${mobileTheme.radius.lg}px`,
            border: `1px solid ${tc.border}`,
            p: `${mobileTheme.spacing.md}px`,
            textAlign: "center"
          }}
        >
          <Typography sx={{ fontSize: 13, color: tc.textMuted, fontStyle: "italic" }}>
            {Locale.label("mobile.details.noAssignedMembers")}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {members.map((m) => (
            <Box
              key={m.id || `${m.personId}-${m.position}`}
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                border: `1px solid ${tc.border}`,
                px: `${mobileTheme.spacing.md}px`,
                py: `${mobileTheme.spacing.sm}px`,
                display: "flex",
                alignItems: "center"
              }}
            >
              <Avatar
                src={m.photo || undefined}
                sx={{ width: 48, height: 48, fontSize: 16, bgcolor: tc.primaryLight, color: tc.primary, mr: 1.5 }}
              >
                {m.name[0]?.toUpperCase() || "?"}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 600, color: tc.text }}>
                  {m.name}
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 500, color: tc.textMuted, mt: 0.25 }}>
                  {m.position}
                </Typography>
              </Box>
              <Icon sx={{ color: tc.disabled, fontSize: 24 }}>chevron_right</Icon>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PlanDetail;
