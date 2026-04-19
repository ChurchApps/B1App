"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Icon,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LinkIcon from "@mui/icons-material/Link";
import { ApiHelper, ArrayHelper } from "@churchapps/apphelper";
import type {
  AssignmentInterface,
  PersonInterface,
  PlanInterface,
  PlanItemInterface,
  PositionInterface,
  TimeInterface,
  VenuePlanItemsResponseInterface,
} from "@churchapps/helpers";
import { LessonsContentProvider } from "@churchapps/helpers";
import { getProvider, type InstructionItem, type IProvider, type Instructions } from "@churchapps/content-providers";
import { PlanItem as PlanItemRow } from "@/app/[sdSlug]/(public)/my/[pageSlug]/components/PlanItem";
import { LessonPreview } from "@/app/[sdSlug]/(public)/my/[pageSlug]/components/LessonPreview";
import { ConfigurationInterface } from "@/helpers/ConfigHelper";
import UserContext from "@/context/UserContext";
import { mobileTheme } from "../mobileTheme";

interface Props {
  id: string;
  config: ConfigurationInterface;
}

interface SongRow {
  id?: string;
  label: string;
  description?: string;
  seconds?: number;
  link?: string;
  key?: string;
  arrangement?: string;
}

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatServiceDate = (date?: Date | string) => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
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
      minute: "2-digit",
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

const flattenSongs = (items: PlanItemInterface[]): SongRow[] => {
  const songs: SongRow[] = [];
  const walk = (arr: PlanItemInterface[]) => {
    arr.forEach((pi) => {
      if (pi.itemType === "song") {
        const extras = pi as unknown as Record<string, any>;
        songs.push({
          id: pi.id,
          label: pi.label || "Untitled Song",
          description: pi.description,
          seconds: pi.seconds,
          link: pi.link || extras.link,
          key: extras.key || extras.songKey,
          arrangement: extras.arrangement,
        });
      }
      if (pi.children?.length) walk(pi.children);
    });
  };
  walk(items);
  return songs;
};

/* Helpers for provider/lesson preview fallback (mirrors B1Mobile + B1App /my ServiceOrder) */
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

  type TabKey = "overview" | "order" | "team" | "songs";
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
        ApiHelper.get(`/times/plan/${id}`, "DoingApi").catch((): any[] => []),
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
        people: peopleRes,
      };
    },
    enabled: !!id && isLoggedIn,
  });

  const plan = planBundle?.plan ?? null;
  const planItems = planBundle?.planItems ?? [];
  const positions = planBundle?.positions ?? [];
  const assignments = planBundle?.assignments ?? [];
  const times = planBundle?.times ?? [];
  const people = planBundle?.people ?? [];
  const notFound = !loading && planBundle !== undefined && !plan;

  const songs = useMemo(() => flattenSongs(planItems), [planItems]);

  const teamGroups = useMemo(() => {
    const groups: { category: string; positions: PositionInterface[] }[] = [];
    const categories = ArrayHelper.getUniqueValues(positions, "categoryName");
    categories.forEach((category: string) => {
      groups.push({
        category: category || "Team",
        positions: ArrayHelper.getAll(positions, "categoryName", category),
      });
    });
    return groups;
  }, [positions]);

  const myAssignments = useMemo(
    () => (myPersonId ? ArrayHelper.getAll(assignments, "personId", myPersonId) : []),
    [assignments, myPersonId]
  );

  /* Provider / lesson preview fallback */
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
          try { instructions = await provider.getInstructions(plan.providerPlanId); } catch { /* ignore */ }
        }
        if (!instructions) {
          try {
            instructions = await ApiHelper.post(
              "/providerProxy/getInstructions",
              { providerId: plan.providerId, path: plan.providerPlanId },
              "DoingApi"
            );
          } catch { /* ignore */ }
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
    enabled: isLoggedIn && !!plan && hasAssociatedContent && planItems.length === 0,
  });
  const showPreviewMode = hasAssociatedContent && planItems.length === 0 && (lessonPreview?.items?.length ?? 0) > 0;

  const refreshAssignments = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const BackButton = (
    <IconButton
      onClick={() => router.push("/mobile/plans")}
      aria-label="Back"
      sx={{
        color: tc.primary,
        bgcolor: tc.surface,
        width: 40,
        height: 40,
        boxShadow: mobileTheme.shadows.sm,
        "&:hover": { bgcolor: tc.surfaceVariant },
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
            mt: 4,
          }}
        >
          <Icon sx={{ fontSize: 56, color: tc.textSecondary, mb: 1 }}>lock</Icon>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            Sign in required
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            Please sign in to view your plan details.
          </Typography>
          <Link
            href={`/login/?returnUrl=/mobile/plans/${id}`}
            style={{ color: tc.primary, fontWeight: 600, textDecoration: "none" }}
          >
            Sign In
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
            mt: 4,
          }}
        >
          <Icon sx={{ fontSize: 56, color: tc.textSecondary, mb: 1 }}>event_busy</Icon>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: tc.text, mb: 1 }}>
            Plan not available
          </Typography>
          <Typography sx={{ fontSize: 14, color: tc.textMuted, mb: 2 }}>
            This plan may have been removed or you may not have access.
          </Typography>
          <Link href="/mobile/plans" style={{ color: tc.primary, fontWeight: 600, textDecoration: "none" }}>
            Back to Plans
          </Link>
        </Box>
      </OuterShell>
    );
  }

  const headerCard = (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.md,
        p: `${mobileTheme.spacing.md}px`,
        mb: `${mobileTheme.spacing.md}px`,
        background: `linear-gradient(135deg, ${tc.primary} 0%, ${tc.secondary} 100%)`,
        color: tc.onPrimary,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Icon sx={{ color: "#FFFFFF" }}>assignment</Icon>
        <Typography sx={{ fontSize: 12, color: "#FFFFFF", opacity: 0.85, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          Service Plan
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.25 }}>
        {plan.name}
      </Typography>
      {plan.serviceDate ? (
        <Typography sx={{ fontSize: 14, color: "#FFFFFF", opacity: 0.9, mt: 0.5 }}>
          {formatServiceDate(plan.serviceDate)}
        </Typography>
      ) : null}
      {times.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
          {times.slice(0, 4).map((t) => {
            const teamLabel = t.teamList && t.teamList.length ? t.teamList.join(", ") : t.teams || "";
            return (
              <Chip
                key={t.id}
                label={t.displayName || teamLabel || "Time"}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#FFFFFF", fontWeight: 500 }}
              />
            );
          })}
        </Box>
      ) : null}
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

      {/* Tabs */}
      <Box
        sx={{
          bgcolor: tc.surface,
          borderRadius: `${mobileTheme.radius.lg}px`,
          boxShadow: mobileTheme.shadows.sm,
          mb: `${mobileTheme.spacing.md}px`,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{ sx: { backgroundColor: tc.primary, height: 3, borderRadius: "3px 3px 0 0" } }}
          sx={{
            minHeight: 48,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              color: tc.textSecondary,
              minHeight: 48,
            },
            "& .Mui-selected": { color: `${tc.primary} !important` },
          }}
        >
          <Tab value="overview" label="Overview" />
          <Tab value="order" label="Service Order" />
          <Tab value="team" label="Team" />
          <Tab value="songs" label="Songs" />
        </Tabs>
      </Box>

      {tab === "overview" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.md}px` }}>
          {/* My Assignments */}
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: `${mobileTheme.spacing.md}px`,
                py: `${mobileTheme.spacing.sm}px`,
                borderRadius: `${mobileTheme.radius.lg}px`,
                bgcolor: `${tc.primary}14`,
                mb: `${mobileTheme.spacing.sm}px`,
              }}
            >
              <Icon sx={{ color: tc.primary, fontSize: 22 }}>assignment_ind</Icon>
              <Typography sx={{ flex: 1, fontSize: 16, fontWeight: 700, color: tc.primary }}>
                My Assignments
              </Typography>
              <Box
                sx={{
                  bgcolor: tc.primary,
                  color: "#FFFFFF",
                  borderRadius: "999px",
                  fontSize: 13,
                  fontWeight: 700,
                  px: 1.25,
                  py: 0.25,
                  minWidth: 28,
                  textAlign: "center",
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
                  textAlign: "center",
                }}
              >
                <Icon sx={{ fontSize: 48, color: tc.textSecondary, mb: 1 }}>assignment_late</Icon>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: tc.text }}>
                  No assignments for this plan
                </Typography>
                <Typography sx={{ fontSize: 13, color: tc.textMuted, mt: 0.5 }}>
                  Check with your team leader if you expected one.
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

          {/* Plan Notes */}
          <Box
            sx={{
              bgcolor: tc.surface,
              borderRadius: `${mobileTheme.radius.lg}px`,
              boxShadow: mobileTheme.shadows.sm,
              p: `${mobileTheme.spacing.md}px`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Icon sx={{ color: tc.primary }}>note</Icon>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: tc.text }}>Plan Notes</Typography>
            </Box>
            {plan.notes ? (
              <Typography sx={{ fontSize: 14, color: tc.textMuted, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {plan.notes}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 13, color: tc.textSecondary, fontStyle: "italic" }}>
                No notes available.
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
            p: `${mobileTheme.spacing.md}px`,
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
              No items in the order of service.
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
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
                No teams assigned yet.
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

      {tab === "songs" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: `${mobileTheme.spacing.sm}px` }}>
          {songs.length === 0 ? (
            <Box
              sx={{
                bgcolor: tc.surface,
                borderRadius: `${mobileTheme.radius.lg}px`,
                boxShadow: mobileTheme.shadows.sm,
                p: `${mobileTheme.spacing.lg}px`,
                textAlign: "center",
              }}
            >
              <Typography sx={{ fontSize: 14, color: tc.textMuted }}>
                No songs scheduled.
              </Typography>
            </Box>
          ) : (
            songs.map((song, i) => <SongCard key={song.id || `${song.label}-${i}`} song={song} />)
          )}
        </Box>
      )}
    </Box>
  );
};

/* ---------- Subcomponents ---------- */

const statusMeta = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "accepted": return { label: "Accepted", color: mobileTheme.colors.success, icon: "check_circle" };
    case "confirmed": return { label: "Confirmed", color: mobileTheme.colors.success, icon: "check_circle" };
    case "declined": return { label: "Declined", color: mobileTheme.colors.error, icon: "cancel" };
    default: return { label: "Pending Response", color: mobileTheme.colors.warning, icon: "schedule" };
  }
};

const PositionDetailsCard = ({
  position,
  assignment,
  times,
  onUpdate,
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
      setErrorMessage(err?.message || `Unable to ${action} assignment. Please try again.`);
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
        p: `${mobileTheme.spacing.md}px`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Icon sx={{ color: tc.primary }}>assignment_ind</Icon>
        <Typography sx={{ flex: 1, fontSize: 16, fontWeight: 700, color: tc.text }}>
          {position.name || "Position"}
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
            fontWeight: 600,
          }}
        >
          <Icon sx={{ fontSize: 14, color: "#FFFFFF" }}>{meta.icon}</Icon>
          <span>{meta.label}</span>
        </Box>
      </Box>

      {sortedTimes.length > 0 && (
        <Box sx={{ mt: 1.25 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: tc.textMuted, mb: 0.75 }}>
            Service Times
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
                  bgcolor: `${tc.primary}0D`,
                }}
              >
                <Icon sx={{ color: tc.primary, fontSize: 18, mt: 0.25 }}>access_time</Icon>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: tc.text }}>
                    {time.displayName || "Service"}
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
            Decline
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
              "&:hover": { bgcolor: tc.success, filter: "brightness(0.95)" },
            }}
          >
            Accept
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
  people,
}: {
  category: string;
  positions: PositionInterface[];
  assignments: AssignmentInterface[];
  people: PersonInterface[];
}) => {
  const tc = mobileTheme.colors;

  const statusColor = (status?: string) => {
    if (status === "Accepted") return tc.success;
    if (status === "Declined") return tc.error;
    return tc.warning;
  };

  return (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: `${mobileTheme.spacing.md}px`,
          py: `${mobileTheme.spacing.sm}px`,
          bgcolor: tc.primaryLight,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Icon sx={{ color: tc.primary, fontSize: 20 }}>groups</Icon>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: tc.primary }}>{category}</Typography>
      </Box>

      <Box>
        {positions.map((pos) => {
          const posAssignments = ArrayHelper.getAll(assignments, "positionId", pos.id);
          return (
            <Box key={pos.id} sx={{ px: `${mobileTheme.spacing.md}px`, py: `${mobileTheme.spacing.sm}px`, borderTop: `1px solid ${tc.border}` }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: tc.textSecondary, mb: 0.5 }}>
                {pos.name} {pos.count && pos.count > 1 ? `(${posAssignments.length}/${pos.count})` : ""}
              </Typography>
              {posAssignments.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: tc.textMuted, fontStyle: "italic" }}>
                  Unassigned
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {posAssignments.map((a) => {
                    const person = ArrayHelper.getOne(people, "id", a.personId);
                    const displayName =
                      person?.name?.display ||
                      [person?.name?.first, person?.name?.last].filter(Boolean).join(" ") ||
                      "Unknown";
                    const photo = person?.photo;
                    return (
                      <Box key={a.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar
                          src={photo || undefined}
                          sx={{ width: 28, height: 28, fontSize: 12, bgcolor: tc.primaryLight, color: tc.primary }}
                        >
                          {displayName[0]?.toUpperCase() || "?"}
                        </Avatar>
                        <Typography sx={{ flex: 1, fontSize: 14, color: tc.text }}>{displayName}</Typography>
                        {a.status ? (
                          <Box
                            sx={{
                              px: 1,
                              py: 0.25,
                              borderRadius: "999px",
                              bgcolor: `${statusColor(a.status)}1A`,
                              color: statusColor(a.status),
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {a.status}
                          </Box>
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const SongCard = ({ song }: { song: SongRow }) => {
  const tc = mobileTheme.colors;
  const openLink = () => {
    if (song.link) window.open(song.link, "_blank", "noopener,noreferrer");
  };
  return (
    <Box
      sx={{
        bgcolor: tc.surface,
        borderRadius: `${mobileTheme.radius.lg}px`,
        boxShadow: mobileTheme.shadows.sm,
        p: `${mobileTheme.spacing.md}px`,
        display: "flex",
        alignItems: "center",
        gap: `${mobileTheme.spacing.md}px`,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: `${mobileTheme.radius.md}px`,
          bgcolor: tc.primaryLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ color: tc.primary }}>music_note</Icon>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 600,
            color: tc.text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {song.label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25, flexWrap: "wrap" }}>
          {song.arrangement ? (
            <Typography sx={{ fontSize: 12, color: tc.textSecondary }}>{song.arrangement}</Typography>
          ) : null}
          {song.key ? (
            <Box
              sx={{
                px: 0.75,
                py: 0.1,
                borderRadius: `${mobileTheme.radius.sm}px`,
                bgcolor: tc.iconBackground,
                color: tc.text,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Key: {song.key}
            </Box>
          ) : null}
          {formatDuration(song.seconds) ? (
            <Typography sx={{ fontSize: 12, color: tc.textMuted, display: "inline-flex", alignItems: "center", gap: 0.25 }}>
              <Icon sx={{ fontSize: 12 }}>schedule</Icon>
              {formatDuration(song.seconds)}
            </Typography>
          ) : null}
        </Box>
      </Box>
      {song.link ? (
        <IconButton
          aria-label="Open song link"
          onClick={openLink}
          sx={{ color: tc.primary }}
        >
          <LinkIcon />
        </IconButton>
      ) : null}
    </Box>
  );
};

export default PlanDetail;
